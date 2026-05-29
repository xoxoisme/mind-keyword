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
import com.xoxoisme.mindkeyword.global.llm.MindMapTree;
import com.xoxoisme.mindkeyword.global.llm.TreeNode;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

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

    @Value("${gemini.api-key}")
    private String geminiApiKey;

    @Value("${gemini.model}")
    private String geminiModel;

    private String extractTextFromPdf(MultipartFile file) {
        try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.PDF_EXTRACT_FAILED);
        }
    }

    private MindMapTree callGemini(String pdfText) {
        String prompt = pdfText.substring(0, Math.min(pdfText.length(), 12000)) + "\n\n" +
                "위 문서를 분석해 마인드맵을 JSON으로 반환하세요. " +
                "반드시 아래 형식만 출력하고 다른 텍스트나 마크다운은 쓰지 마세요.\n" +
                "{\"title\":\"...\",\"root\":{\"content\":\"...\",\"children\":[{\"content\":\"...\",\"children\":[...]}]}}\n" +
                "title은 짧은 키워드, 각 content는 30자 이하로 핵심 개념 위주로 작성하세요.";

        GeminiRequest request = new GeminiRequest(
                List.of(new GeminiContent(List.of(new GeminiPart(prompt))))
        );

        String uri = "https://generativelanguage.googleapis.com/v1beta/models/"
                + geminiModel + ":generateContent?key=" + geminiApiKey;

        GeminiResponse response = webClient
                .post()
                .uri(uri)
                .bodyValue(request)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        res -> Mono.error(new BusinessException(ErrorCode.OPENAI_API_FAILED)))
                .bodyToMono(GeminiResponse.class)
                .block();

        try {
            String raw = response.candidates().get(0).content().parts().get(0).text();
            // 마크다운 코드 블록 제거
            String json = raw.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(json, MindMapTree.class);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.OPENAI_API_FAILED);
        }
    }

    @Transactional
    public MindMapResponse generateFromPdf(Long userId, MultipartFile file, Long folderId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        String pdfText = extractTextFromPdf(file);
        MindMapTree tree = callGemini(pdfText);

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
