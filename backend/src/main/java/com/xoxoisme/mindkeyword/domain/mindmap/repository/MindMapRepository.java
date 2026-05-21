package com.xoxoisme.mindkeyword.domain.mindmap.repository;

import com.xoxoisme.mindkeyword.domain.mindmap.entity.MindMap;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MindMapRepository extends JpaRepository<MindMap, Long> {

    List<MindMap> findAllByUserId(Long userId);

    List<MindMap> findAllByFolderId(Long folderId);
}
