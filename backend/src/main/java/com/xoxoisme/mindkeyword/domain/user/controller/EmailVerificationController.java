package com.xoxoisme.mindkeyword.domain.user.controller;

import com.xoxoisme.mindkeyword.domain.user.dto.request.EmailConfirmRequestDto;
import com.xoxoisme.mindkeyword.domain.user.dto.request.EmailVerifyRequestDto;
import com.xoxoisme.mindkeyword.domain.user.service.EmailVerificationService;
import com.xoxoisme.mindkeyword.global.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/user/email")
@RequiredArgsConstructor
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    @PostMapping("/verify-request")
    public ApiResponse<Void> requestVerification (@RequestBody @Valid EmailVerifyRequestDto request) {
        emailVerificationService.sendCode(request);
        return ApiResponse.ok();
    }

    @PostMapping("/verify-confirm")
    public ApiResponse<Void> confirmVerification (@RequestBody @Valid EmailConfirmRequestDto request) {
        emailVerificationService.confirmCode(request);
        return ApiResponse.ok();
    }
}
