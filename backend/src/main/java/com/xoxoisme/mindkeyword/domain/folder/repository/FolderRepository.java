package com.xoxoisme.mindkeyword.domain.folder.repository;

import com.xoxoisme.mindkeyword.domain.folder.entity.Folder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FolderRepository extends JpaRepository<Folder, Long> {
    List<Folder> findAllByUserId(Long userId);

    // 삭제 시 자식 폴더 조회에 사용
    List<Folder> findAllByParentId(Long parentId);
}
