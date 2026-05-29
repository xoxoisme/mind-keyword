package com.xoxoisme.mindkeyword.global.gemini.dto;

import java.util.List;

public record GeminiResponse(List<GeminiCandidate> candidates) {}
