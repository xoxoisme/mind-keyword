package com.xoxoisme.mindkeyword.global.openai.dto.Request;

import java.util.List;

public record ChatRequest(
        String model,
        List<ChatMessage> messages
) {
}
