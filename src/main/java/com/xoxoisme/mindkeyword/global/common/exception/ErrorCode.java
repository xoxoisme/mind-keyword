package com.xoxoisme.mindkeyword.global.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common
    INVALID_INPUT_VALUE("C001", HttpStatus.BAD_REQUEST, "잘못된 입력값입니다."),

    // User
    EMAIL_ALREADY_EXISTS("U001", HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    NICKNAME_ALREADY_EXISTS("U002", HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다."),
    USER_NOT_FOUND("U003", HttpStatus.NOT_FOUND , "존재하지 않는 사용자입니다.");


    private final String code;
    private final HttpStatus status;
    private final String message;
}
