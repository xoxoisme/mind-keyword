package com.xoxoisme.mindkeyword.global.openai.dto.Response;

import java.util.List;

public record ChatResponse(
        List<ChatChoice> choices
) {
}
