package com.xoxoisme.mindkeyword.domain.folder.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FolderRequest(
        @NotBlank @Size(max = 30) String name
) {
}
