package com.xoxoisme.mindkeyword.domain.node.repository;

import com.xoxoisme.mindkeyword.domain.node.entity.Node;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public interface NodeRepository extends JpaRepository<Node, Long> {
}
