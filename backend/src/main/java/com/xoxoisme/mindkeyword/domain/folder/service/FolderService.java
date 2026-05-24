package com.xoxoisme.mindkeyword.domain.folder.service;

import com.xoxoisme.mindkeyword.domain.folder.dto.request.FolderRequest;
import com.xoxoisme.mindkeyword.domain.folder.dto.response.FolderResponse;
import com.xoxoisme.mindkeyword.domain.folder.entity.Folder;
import com.xoxoisme.mindkeyword.domain.folder.repository.FolderRepository;
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

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FolderService {

    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    private final MindMapRepository mindMapRepository;

    @Transactional
    public FolderResponse create(Long userId, FolderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return FolderResponse.from(folderRepository.save(Folder.create(user, request.name())));
    }

    @Transactional
    public void rename(Long userId, Long folderId, FolderRequest request) {
        getOwnedFolder(userId, folderId).rename(request.name());
    }

    public void delete(Long userId, Long folderId) {
        Folder folder = getOwnedFolder(userId, folderId);
        List<MindMap> mindmapList = mindMapRepository.findAllByFolderId(folderId);
        mindmapList.forEach(m -> m.updateFolder(null));
        folderRepository.delete(folder);
    }

    public List<FolderResponse> getAll(Long userId) {
    }

    private Folder getOwnedFolder(Long userId, Long folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FOLDER_NOT_FOUND));
        if (!folder.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return folder;
    }
}
