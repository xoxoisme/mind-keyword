package com.xoxoisme.mindkeyword.domain.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EmailConfirmRequestDto(
        @NotBlank @Email String email,
        @NotBlank String code
) {
}
