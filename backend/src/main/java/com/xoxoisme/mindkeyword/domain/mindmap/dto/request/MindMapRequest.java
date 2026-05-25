package com.xoxoisme.mindkeyword.domain.mindmap.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MindMapRequest(
        @NotBlank @Size(max = 30) String title,
        Long folderId
) {
}
