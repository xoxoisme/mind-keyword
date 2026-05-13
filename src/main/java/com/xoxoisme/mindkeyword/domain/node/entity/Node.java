package com.xoxoisme.mindkeyword.domain.node.entity;

import com.xoxoisme.mindkeyword.domain.mindmap.entity.MindMap;
import com.xoxoisme.mindkeyword.global.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "node")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Node extends BaseTimeEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "mind_map_id")
    private MindMap mindMap;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Node parent;

    @Column(length = 50)
    private String content;

    @Column(nullable = false, name = "position_x")
    private Double positionX;

    @Column(nullable = false, name = "position_y")
    private Double positionY;
}
