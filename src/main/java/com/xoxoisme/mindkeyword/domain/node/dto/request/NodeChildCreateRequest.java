package com.xoxoisme.mindkeyword.domain.node.dto.request;

import com.xoxoisme.mindkeyword.domain.node.entity.Node;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NodeChildCreateRequest(
        Long parentId,
        @Size(max = 50) String content,
        Double positionX,
        Double positionY
) {
}
