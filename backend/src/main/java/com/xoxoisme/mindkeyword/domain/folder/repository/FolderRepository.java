package com.xoxoisme.mindkeyword.domain.folder.repository;

import com.xoxoisme.mindkeyword.domain.folder.entity.Folder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface FolderRepository extends JpaRepository<Folder, Long> {
    List<Folder> findAllByUserId(Long userId);
}