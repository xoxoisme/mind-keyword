package com.xoxoisme.mindkeyword.domain.user.controller;

import com.xoxoisme.mindkeyword.domain.user.dto.request.LoginRequest;
import com.xoxoisme.mindkeyword.domain.user.dto.request.SignupRequest;
import com.xoxoisme.mindkeyword.domain.user.dto.response.TokenResponse;
import com.xoxoisme.mindkeyword.domain.user.service.UserService;
import com.xoxoisme.mindkeyword.global.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Void> signup(@RequestBody @Valid SignupRequest request) {
        userService.signup(request);
        return ApiResponse.ok();
    }

    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@RequestBody @Valid LoginRequest request) {
        return ApiResponse.ok(userService.login(request));
    }
}
