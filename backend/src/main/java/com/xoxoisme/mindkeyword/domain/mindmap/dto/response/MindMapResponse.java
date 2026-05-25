package com.xoxoisme.mindkeyword.domain.mindmap.dto.response;

import com.xoxoisme.mindkeyword.domain.mindmap.entity.MindMap;
import jakarta.validation.constraints.Size;

public record MindMapResponse(
        Long id,
        @Size(max = 50) String title,
        Long folderId
) {
    public static MindMapResponse from (MindMap mindMap) {
        return new MindMapResponse(
                mindMap.getId(),
                mindMap.getTitle(),
                mindMap.getFolder() != null ? mindMap.getFolder().getId() : null
        );
    }
}
