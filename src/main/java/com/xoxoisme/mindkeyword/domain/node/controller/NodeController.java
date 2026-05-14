package com.xoxoisme.mindkeyword.domain.node.controller;

import com.xoxoisme.mindkeyword.domain.node.dto.request.NodeRootCreateRequest;
import com.xoxoisme.mindkeyword.domain.node.dto.response.NodeResponse;
import com.xoxoisme.mindkeyword.domain.node.entity.Node;
import com.xoxoisme.mindkeyword.domain.node.service.NodeService;
import com.xoxoisme.mindkeyword.global.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mindmaps/{mindMapId}/nodes")
@RequiredArgsConstructor
public class NodeController {

    private final NodeService nodeService;

    @PostMapping("/root")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<NodeResponse> createRoot(@PathVariable Long mindMapId, @RequestBody @Valid NodeRootCreateRequest request, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.ok(nodeService.createRoot(userId, mindMapId, request));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<NodeResponse> create(@PathVariable Long mindMapId, )
}
