package com.xoxoisme.mindkeyword.domain.folder.service;

import com.xoxoisme.mindkeyword.domain.folder.dto.request.FolderRequest;
import com.xoxoisme.mindkeyword.domain.folder.dto.response.FolderResponse;
import com.xoxoisme.mindkeyword.domain.folder.entity.Folder;
import com.xoxoisme.mindkeyword.domain.folder.repository.FolderRepository;
import com.xoxoisme.mindkeyword.domain.mindmap.repository.MindMapRepository;
import com.xoxoisme.mindkeyword.domain.node.repository.NodeRepository;
import com.xoxoisme.mindkeyword.domain.user.entity.User;
import com.xoxoisme.mindkeyword.domain.user.repository.UserRepository;
import com.xoxoisme.mindkeyword.global.common.exception.BusinessException;
import com.xoxoisme.mindkeyword.global.common.exception.ErrorCode;
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
    private final NodeRepository nodeRepository;

    @Transactional
    public FolderResponse create(Long userId, FolderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (request.parentId() != null) {
            Folder parent = folderRepository.findById(request.parentId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.FOLDER_NOT_FOUND));
            return FolderResponse.from(folderRepository.save(Folder.createSub(user, request.name(), parent)));
        }

        return FolderResponse.from(folderRepository.save(Folder.create(user, request.name())));
    }

    @Transactional
    public void rename(Long userId, Long folderId, FolderRequest request) {
        getOwnedFolder(userId, folderId).rename(request.name());
    }

    @Transactional
    public void delete(Long userId, Long folderId) {
        Folder folder = getOwnedFolder(userId, folderId);
        deleteRecursively(folder);
    }

    // 폴더와 하위 폴더, 마인드맵(노드 포함)을 모두 재귀적으로 삭제
    private void deleteRecursively(Folder folder) {
        folderRepository.findAllByParentId(folder.getId())
                .forEach(this::deleteRecursively);

        mindMapRepository.findAllByFolderId(folder.getId()).forEach(mindMap -> {
            nodeRepository.deleteAllByMindMapId(mindMap.getId());
            mindMapRepository.delete(mindMap);
        });

        folderRepository.delete(folder);
    }

    public List<FolderResponse> getAll(Long userId) {
        return folderRepository.findAllByUserId(userId).stream()
                .map(FolderResponse::from)
                .toList();
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
