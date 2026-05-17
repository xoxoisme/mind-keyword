package com.xoxoisme.mindkeyword.domain.folder.dto.response;

import com.xoxoisme.mindkeyword.domain.folder.entity.Folder;

public record FolderResponse(Long id, String name) {
    public static FolderResponse from(Folder folder) {
        return new FolderResponse(folder.getId(), folder.getName());
    }
}
