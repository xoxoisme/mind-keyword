package com.xoxoisme.mindkeyword.domain.mindmap.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xoxoisme.mindkeyword.domain.folder.entity.Folder;
import com.xoxoisme.mindkeyword.domain.folder.repository.FolderRepository;
import com.xoxoisme.mindkeyword.domain.mindmap.dto.response.MindMapResponse;
import com.xoxoisme.mindkeyword.domain.mindmap.entity.MindMap;
import com.xoxoisme.mindkeyword.domain.mindmap.repository.MindMapRepository;
import com.xoxoisme.mindkeyword.domain.node.entity.Node;
import com.xoxoisme.mindkeyword.domain.node.repository.NodeRepository;
import com.xoxoisme.mindkeyword.domain.user.entity.User;
import com.xoxoisme.mindkeyword.domain.user.repository.UserRepository;
import com.xoxoisme.mindkeyword.global.common.exception.BusinessException;
import com.xoxoisme.mindkeyword.global.common.exception.ErrorCode;
import com.xoxoisme.mindkeyword.global.openai.dto.MindMapTree;
import com.xoxoisme.mindkeyword.global.openai.dto.Request.ChatMessage;
import com.xoxoisme.mindkeyword.global.openai.dto.Request.ChatRequest;
import com.xoxoisme.mindkeyword.global.openai.dto.Response.ChatResponse;
import com.xoxoisme.mindkeyword.global.openai.dto.TreeNode;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PdfMindMapService {


    private final MindMapRepository mindMapRepository;
    private final NodeRepository nodeRepository;
    private final UserRepository userRepository;
    private final FolderRepository folderRepository;
    private final WebClient webClient;

    @Value("${openai.api-key}")
    private String openAiApiKey;

    @Value("${openai.model}")
    private String openAiModel;

    // PDF에서 텍스트를 추출합니다.
    private String extractTextFromPdf(MultipartFile file) {
        try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.PDF_EXTRACT_FAILED);
        }
    }

    // 추출된 텍스트를 OpenAI API로 전송해 계층형 마인드맵 JSON을 받습니다.
    private MindMapTree callOpenAI(String pdfText) {
        ChatMessage message = new ChatMessage("user", pdfText + "\n\n" +
                "문서를 분석해 마인드맵을 JSON으로 반환하세요. " +
                "형식: {\"title\":\"...\",\"root\":{\"content\":\"...\",\"children\":[...]}} " +
                "title은 하나의 키워드나 짧은 문장으로 해주고, 각 노드의 content는 30자 이하, 핵심 개념 위주로 계층 구조를 만드세요. " +
                "JSON만 반환하고 다른 텍스트는 쓰지 마세요.");
        ChatRequest request = new ChatRequest(openAiModel, List.of(message));

        ChatResponse response = webClient
                .post()
                .uri("https://api.openai.com/v1/chat/completions")
                .header("Authorization", "Bearer " + openAiApiKey)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(ChatResponse.class)
                .block();

        try {
            String content = response.choices().get(0).message().content();
            ObjectMapper objectMapper = new ObjectMapper();
            return objectMapper.readValue(content, MindMapTree.class);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.OPENAI_API_FAILED);
        }
    }

    @Transactional
    public MindMapResponse generateFromPdf(Long userId, MultipartFile file, Long folderId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        String pdfText = extractTextFromPdf(file);
        MindMapTree tree = callOpenAI(pdfText);

        String title = truncate(tree.title(), 30);
        if (title.isBlank()) title = "PDF 마인드맵";

        MindMap mindMap = mindMapRepository.save(MindMap.create(user, title));

        if (folderId != null) {
            Folder folder = folderRepository.findById(folderId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.FOLDER_NOT_FOUND));
            mindMap.updateFolder(folder);
        }

        if (tree.root() != null) {
            Node root = nodeRepository.save(Node.createRoot(mindMap, truncate(tree.root().content(), 50)));
            int[] yCounter = {0};
            createChildrenRecursively(mindMap, root, tree.root().children(), 1, yCounter);
        }

        return MindMapResponse.from(mindMap);
    }

    // 깊이(depth) * 250px를 X축으로, 전역 yCounter * 100px를 Y축으로 배치
    // yCounter를 모든 재귀 호출이 공유해 노드 간 Y 겹침을 방지
    private void createChildrenRecursively(MindMap mindMap, Node parent, List<TreeNode> children, int depth, int[] yCounter) {
        if (children == null || children.isEmpty()) return;
        for (TreeNode tc : children) {
            double posX = depth * 250.0;
            double posY = yCounter[0]++ * 100.0;
            Node child = nodeRepository.save(Node.createChild(mindMap, parent, truncate(tc.content(), 50), posX, posY));
            createChildrenRecursively(mindMap, child, tc.children(), depth + 1, yCounter);
        }
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return "";
        return s.length() > maxLen ? s.substring(0, maxLen) : s;
    }
}
