package com.xoxoisme.mindkeyword.domain.node.service;

import com.xoxoisme.mindkeyword.domain.mindmap.entity.MindMap;
import com.xoxoisme.mindkeyword.domain.mindmap.repository.MindMapRepository;
import com.xoxoisme.mindkeyword.domain.node.dto.request.NodeRootCreateRequest;
import com.xoxoisme.mindkeyword.domain.node.dto.response.NodeResponse;
import com.xoxoisme.mindkeyword.domain.node.entity.Node;
import com.xoxoisme.mindkeyword.domain.node.repository.NodeRepository;
import com.xoxoisme.mindkeyword.domain.user.entity.User;
import com.xoxoisme.mindkeyword.domain.user.repository.UserRepository;
import com.xoxoisme.mindkeyword.global.common.exception.BusinessException;
import com.xoxoisme.mindkeyword.global.common.exception.ErrorCode;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NodeService {

    private final UserRepository userRepository;
    private final MindMapRepository mindMapRepository;
    private final NodeRepository nodeRepository;

    @Transactional
    public NodeResponse createRoot(Long userId, Long mindMapId, NodeRootCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        MindMap mindMap = mindMapRepository.findById(mindMapId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MIND_MAP_NOT_FOUND));
        Node node = Node.createRoot(mindMap, request.content());
        nodeRepository.save(node);
        return NodeResponse.from(node);
    }
}
