package com.xoxoisme.mindkeyword.global.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common
    INVALID_INPUT_VALUE("C001", HttpStatus.BAD_REQUEST, "잘못된 입력값입니다."),
    FORBIDDEN("C002", HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),

    // User
    EMAIL_ALREADY_EXISTS("U001", HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    NICKNAME_ALREADY_EXISTS("U002", HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다."),
    USER_NOT_FOUND("U003", HttpStatus.NOT_FOUND , "존재하지 않는 사용자입니다."),

    // MindMap
    MIND_MAP_NOT_FOUND("M001", HttpStatus.NOT_FOUND , "존재하지 않는 마인드맵입니다."),

    // Node
    PARENT_NODE_NOT_FOUND("N001", HttpStatus.NOT_FOUND, "상위 노드가 존재하지 않습니다."),
    NODE_NOT_FOUND("N002", HttpStatus.NOT_FOUND, "존재하지 않는 노드입니다.");


    private final String code;
    private final HttpStatus status;
    private final String message;
}
