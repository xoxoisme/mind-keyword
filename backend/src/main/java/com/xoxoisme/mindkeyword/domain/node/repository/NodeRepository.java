package com.xoxoisme.mindkeyword.domain.node.repository;

import com.xoxoisme.mindkeyword.domain.node.entity.Node;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;


public interface NodeRepository extends JpaRepository<Node, Long> {
    List<Node> findAllByMindMapId(Long mindMapId);

    List<Node> findAllByParentId(Long id);

    void deleteAllByMindMapId(Long mindMapId);
}
