package com.xoxoisme.mindkeyword.global.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // User
    EMAIL_ALREADY_EXISTS("U001", HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    NICKNAME_ALREADY_EXISTS("U002", HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다.")
    ;

    private final String code;
    private final HttpStatus status;
    private final String message;
}
