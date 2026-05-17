package com.xoxoisme.mindkeyword.domain.folder.controller;

import com.xoxoisme.mindkeyword.domain.folder.dto.request.FolderRequest;
import com.xoxoisme.mindkeyword.domain.folder.dto.response.FolderResponse;
import com.xoxoisme.mindkeyword.domain.folder.service.FolderService;
import com.xoxoisme.mindkeyword.global.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<FolderResponse> create(@RequestBody @Valid FolderRequest request, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.ok(folderService.create(userId, request));
    }

}
