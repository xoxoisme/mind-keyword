package com.xoxoisme.mindkeyword.domain.node.repository;

import com.xoxoisme.mindkeyword.domain.node.entity.Node;
import org.springframework.data.jpa.repository.JpaRepository;


public interface NodeRepository extends JpaRepository<Node, Long> {
}
