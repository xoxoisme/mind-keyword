package com.xoxoisme.mindkeyword.global.openai.dto.Response;

import com.xoxoisme.mindkeyword.global.openai.dto.Request.ChatMessage;

public record ChatChoice(
        ChatMessage message
) {
}
