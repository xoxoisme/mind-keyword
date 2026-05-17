package com.xoxoisme.mindkeyword.domain.node.controller;

import com.xoxoisme.mindkeyword.domain.node.dto.request.NodeChildCreateRequest;
import com.xoxoisme.mindkeyword.domain.node.dto.request.NodeRootCreateRequest;
import com.xoxoisme.mindkeyword.domain.node.dto.request.NodeUpdateRequest;
import com.xoxoisme.mindkeyword.domain.node.dto.response.NodeResponse;
import com.xoxoisme.mindkeyword.domain.node.service.NodeService;
import com.xoxoisme.mindkeyword.global.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ApiResponse<NodeResponse> createChild(@PathVariable Long mindMapId, @RequestBody @Valid NodeChildCreateRequest request, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.ok(nodeService.createChild(userId, mindMapId, request));
    }

    @PatchMapping("/{nodeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void update(@PathVariable Long nodeId, @PathVariable Long mindMapId, @RequestBody @Valid NodeUpdateRequest request, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        nodeService.update(nodeId, userId, mindMapId, request);
    }

    @DeleteMapping("/{nodeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long nodeId, @PathVariable Long mindMapId, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        nodeService.delete(nodeId, userId, mindMapId);
    }

    @GetMapping
    public ApiResponse<List<NodeResponse>> allNodes(@PathVariable Long mindMapId, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.ok(nodeService.getAllNodes(userId, mindMapId));
    }
}
