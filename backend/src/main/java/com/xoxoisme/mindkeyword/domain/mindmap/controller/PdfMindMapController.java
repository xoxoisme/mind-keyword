package com.xoxoisme.mindkeyword.domain.mindmap.controller;

import com.xoxoisme.mindkeyword.domain.mindmap.dto.response.MindMapResponse;
import com.xoxoisme.mindkeyword.domain.mindmap.service.PdfMindMapService;
import com.xoxoisme.mindkeyword.global.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/mindmaps")
@RequiredArgsConstructor
public class PdfMindMapController {

    private final PdfMindMapService pdfMindMapService;

    @PostMapping("/from-pdf")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MindMapResponse> generateFromPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Long folderId,
            Authentication authentication
    ) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.ok(pdfMindMapService.generateFromPdf(userId, file, folderId));
    }
}
