package com.xoxoisme.mindkeyword.domain.folder.service;

import com.xoxoisme.mindkeyword.domain.folder.dto.request.FolderRequest;
import com.xoxoisme.mindkeyword.domain.folder.dto.response.FolderResponse;
import com.xoxoisme.mindkeyword.domain.folder.entity.Folder;
import com.xoxoisme.mindkeyword.domain.folder.repository.FolderRepository;
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
public class FolderService {

    private final FolderRepository folderRepository;
    private final UserRepository userRepository;

    public FolderResponse create(Long userId, FolderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return FolderResponse.from(folderRepository.save(Folder.create(user, request.name())));
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
