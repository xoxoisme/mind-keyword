package com.xoxoisme.mindkeyword.domain.mindmap.controller;

import com.xoxoisme.mindkeyword.domain.mindmap.dto.request.MindMapRequest;
import com.xoxoisme.mindkeyword.domain.mindmap.dto.response.MindMapResponse;
import com.xoxoisme.mindkeyword.domain.mindmap.service.MindMapService;
import com.xoxoisme.mindkeyword.global.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mindmaps")
@RequiredArgsConstructor
public class MindMapController {

    private final MindMapService mindMapService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MindMapResponse> create(@RequestBody @Valid MindMapRequest request, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.ok(mindMapService.create(userId, request));
    }

    @PatchMapping("/{mindMapId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void update(@PathVariable Long mindMapId, @RequestBody @Valid MindMapRequest request, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        mindMapService.update(userId, mindMapId, request);
    }

    @DeleteMapping("/{mindMapId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long mindMapId, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        mindMapService.delete(userId, mindMapId);
    }

    @GetMapping
    public ApiResponse<List<MindMapResponse>> allMindMaps(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.ok(mindMapService.getAllMindMaps(userId));
    }
}
