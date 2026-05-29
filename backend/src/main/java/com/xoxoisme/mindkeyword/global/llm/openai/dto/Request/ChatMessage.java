package com.xoxoisme.mindkeyword.global.openai.dto.Request;

public record ChatMessage(
        String role,
        String content
) {
}
