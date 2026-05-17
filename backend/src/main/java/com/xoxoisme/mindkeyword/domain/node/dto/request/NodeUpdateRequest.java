package com.xoxoisme.mindkeyword.domain.node.dto.request;

import jakarta.validation.constraints.Size;

public record NodeUpdateRequest(
        @Size(max = 50) String content,
        Double positionX,
        Double positionY
) {
}
