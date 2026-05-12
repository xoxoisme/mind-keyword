package com.xoxoisme.mindkeyword.domain.mindmap.dto.response;

import com.xoxoisme.mindkeyword.domain.mindmap.entity.MindMap;

public record MindMapResponse(
        Long id
) {
    public static MindMapResponse from (MindMap mindMap) {
        return new MindMapResponse(mindMap.getId());
    }
}
