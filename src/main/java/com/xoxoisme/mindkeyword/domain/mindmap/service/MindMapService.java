package com.xoxoisme.mindkeyword.domain.mindmap.service;

import com.xoxoisme.mindkeyword.domain.mindmap.dto.request.MindMapRequest;
import com.xoxoisme.mindkeyword.domain.mindmap.dto.response.MindMapResponse;
import com.xoxoisme.mindkeyword.domain.mindmap.entity.MindMap;
import com.xoxoisme.mindkeyword.domain.mindmap.repository.MindMapRepository;
import com.xoxoisme.mindkeyword.domain.user.entity.User;
import com.xoxoisme.mindkeyword.domain.user.repository.UserRepository;
import com.xoxoisme.mindkeyword.global.common.exception.BusinessException;
import com.xoxoisme.mindkeyword.global.common.exception.ErrorCode;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MindMapService {

    private final MindMapRepository mindMapRepository;
    private final UserRepository userRepository;

    @Transactional
    public MindMapResponse create(Long userId, @Valid MindMapRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return MindMapResponse.from(
                mindMapRepository.save(MindMap.create(user, request.title()))
        );
    }

    @Transactional
    public void update(Long userId, Long mindMapId, @Valid MindMapRequest request) {
        MindMap mindMap= getOwnedMindMap(userId, mindMapId);
        mindMap.update(request.title());
    }

    @Transactional
    public void delete(Long userId, Long mindMapId) {
        MindMap mindMap = getOwnedMindMap(userId, mindMapId);
        mindMapRepository.delete(mindMap);
    }

    private MindMap getOwnedMindMap(Long userId, Long mindMapId) {
        MindMap mindMap = mindMapRepository.findById(mindMapId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MIND_MAP_NOT_FOUND));
        if (!mindMap.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return mindMap;
    }
}
