package com.xoxoisme.mindkeyword.domain.node.entity;

import com.xoxoisme.mindkeyword.domain.mindmap.entity.MindMap;
import com.xoxoisme.mindkeyword.global.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
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

    public static Node createRoot(MindMap mindMap, String content) {
        Node node = new Node();
        node.mindMap = mindMap;
        node.parent = null;
        node.content = content;
        node.positionX = 0.0;
        node.positionY = 0.0;
        return node;
    }

    public static Node createChild(MindMap mindMap, Node parent, String content, Double positionX, Double positionY) {
        Node node = new Node();
        node.mindMap = mindMap;
        node.parent = parent;
        node.content = content;
        node.positionX = positionX;
        node.positionY = positionY;
        return node;
    }

    public void updatePosition(Double positionX, Double positionY) {
        this.positionX = positionX;
        this.positionY = positionY;
    }

    public void updateContent(String content) {
        this.content = content;
    }


    public void update(String content, Double positionX, Double positionY) {
        this.content = content;
        this.positionX = positionX;
        this.positionY = positionY;
    }
}
