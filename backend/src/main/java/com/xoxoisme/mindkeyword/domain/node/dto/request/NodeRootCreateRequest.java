package com.xoxoisme.mindkeyword.domain.node.dto.request;


import jakarta.validation.constraints.Size;

public record NodeRootCreateRequest(
        @Size(max = 50) String content
) {
}
