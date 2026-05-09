package com.xoxoisme.mindkeyword.global.response;

import lombok.Getter;

@Getter
public class ApiResponse<T> {

    private final boolean success;
    private final T data;

    private ApiResponse(boolean success, T data) {
        this.success = success;
        this.data = data;
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data);
    }

    public static ApiResponse<Void> ok() {
        return new ApiResponse<>(true, null);
    }
}


