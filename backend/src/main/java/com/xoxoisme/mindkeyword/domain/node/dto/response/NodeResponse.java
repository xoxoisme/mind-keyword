package com.xoxoisme.mindkeyword.domain.node.dto.response;

import com.xoxoisme.mindkeyword.domain.mindmap.entity.MindMap;
import com.xoxoisme.mindkeyword.domain.node.entity.Node;

public record NodeResponse(
        Long id,
        Long parentId,
        String content,
        Double positionX,
        Double positionY
) {
    public static NodeResponse from (Node node) {
        return new NodeResponse(
                node.getId(),
                node.getParent() != null ? node.getParent().getId() : null,
                node.getContent(),
                node.getPositionX(),
                node.getPositionY()
        );
    }
}
