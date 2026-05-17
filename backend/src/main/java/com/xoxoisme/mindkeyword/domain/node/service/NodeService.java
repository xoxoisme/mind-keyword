package com.xoxoisme.mindkeyword.domain.node.service;

import com.xoxoisme.mindkeyword.domain.mindmap.entity.MindMap;
import com.xoxoisme.mindkeyword.domain.mindmap.repository.MindMapRepository;
import com.xoxoisme.mindkeyword.domain.node.dto.request.NodeChildCreateRequest;
import com.xoxoisme.mindkeyword.domain.node.dto.request.NodeRootCreateRequest;
import com.xoxoisme.mindkeyword.domain.node.dto.request.NodeUpdateRequest;
import com.xoxoisme.mindkeyword.domain.node.dto.response.NodeResponse;
import com.xoxoisme.mindkeyword.domain.node.entity.Node;
import com.xoxoisme.mindkeyword.domain.node.repository.NodeRepository;
import com.xoxoisme.mindkeyword.global.common.exception.BusinessException;
import com.xoxoisme.mindkeyword.global.common.exception.ErrorCode;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NodeService {

    private final MindMapRepository mindMapRepository;
    private final NodeRepository nodeRepository;

    @Transactional
    public NodeResponse createRoot(Long userId, Long mindMapId, NodeRootCreateRequest request) {
        MindMap mindMap = getOwnedMindMap(userId, mindMapId);
        Node node = Node.createRoot(mindMap, request.content());
        nodeRepository.save(node);
        return NodeResponse.from(node);
    }

    @Transactional
    public NodeResponse createChild(Long userId, Long mindMapId, NodeChildCreateRequest request) {
        MindMap mindMap = getOwnedMindMap(userId, mindMapId);
        Node parent = nodeRepository.findById(request.parentId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PARENT_NODE_NOT_FOUND));
        Node node = Node.createChild(mindMap, parent, request.content(), request.positionX(), request.positionY());
        nodeRepository.save(node);
        return NodeResponse.from(node);
    }

    @Transactional
    public void update(Long nodeId, Long userId, Long mindMapId, @Valid NodeUpdateRequest request) {
        getOwnedMindMap(userId, mindMapId);
        Node node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NODE_NOT_FOUND));
        node.update(request.content(), request.positionX(), request.positionY());
        nodeRepository.save(node);
    }

    @Transactional
    public void delete(Long nodeId, Long userId, Long mindMapId) {
        getOwnedMindMap(userId, mindMapId);
        Node node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NODE_NOT_FOUND));
        nodeRepository.delete(node);
    }

    public List<NodeResponse> getAllNodes(Long userId, Long mindMapId) {
        getOwnedMindMap(userId, mindMapId);
        return nodeRepository.findAllByMindMapId(mindMapId)
                .stream()
                .map(NodeResponse::from)
                .toList();
    }

    private MindMap getOwnedMindMap(Long userId, Long mindMapId) {
        MindMap mindMap = mindMapRepository.findById(mindMapId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MIND_MAP_NOT_FOUND));
        if (!mindMap.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return mindMap;
    }
}
