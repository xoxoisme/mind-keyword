package com.xoxoisme.mindkeyword.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    ;

    private final String code;
    private final HttpStatus status;
    private final String message;
}
