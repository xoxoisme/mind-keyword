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
    USER_NOT_FOUND("U002", HttpStatus.NOT_FOUND , "존재하지 않는 사용자입니다."),

    // MindMap
    MIND_MAP_NOT_FOUND("M001", HttpStatus.NOT_FOUND , "존재하지 않는 마인드맵입니다."),

    // MindMap(PDF)
    PDF_EXTRACT_FAILED("MP001", HttpStatus.INTERNAL_SERVER_ERROR, "PDF 텍스트 추출에 실패했습니다."),
    OPENAI_API_FAILED("MP002", HttpStatus.INTERNAL_SERVER_ERROR, "OpenAI 호출에 실패했습니다."),
    // Node
    PARENT_NODE_NOT_FOUND("N001", HttpStatus.NOT_FOUND, "상위 노드가 존재하지 않습니다."),
    NODE_NOT_FOUND("N002", HttpStatus.NOT_FOUND, "존재하지 않는 노드입니다."),

    // Folder
    FOLDER_NOT_FOUND("F001", HttpStatus.NOT_FOUND, "존재하지 않는 폴더입니다."),

    // Email
    EMAIL_SEND_FAILED("E001", HttpStatus.INTERNAL_SERVER_ERROR, "인증코드 전송에 실패했습니다."),
    EMAIL_VERIFY_CODE_EXPIRED("E002", HttpStatus.BAD_REQUEST, "인증코드 만료시간이 지났습니다."),
    EMAIL_VERIFY_CODE_INVALID("E003", HttpStatus.BAD_REQUEST, "인증코드가 일치하지 않습니다."),
    EMAIL_NOT_VERIFIED("E004", HttpStatus.BAD_REQUEST, "이메일 인증이 완료되지 않았습니다.");


    private final String code;
    private final HttpStatus status;
    private final String message;
}
