package com.xoxoisme.mindkeyword.domain.mindmap.entity;

import com.xoxoisme.mindkeyword.domain.folder.entity.Folder;
import com.xoxoisme.mindkeyword.domain.user.entity.User;
import com.xoxoisme.mindkeyword.global.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "mind_map")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MindMap extends BaseTimeEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    private Folder folder;

    @Column(nullable = false, length = 30)
    private String title;

    public static MindMap create(User user, String title) {
        MindMap mindMap = new MindMap();
        mindMap.user = user;
        mindMap.title = title;
        return mindMap;
    }

    public void update(String title) {
        this.title = title;
    }

    public void updateFolder(Folder folder) {
        this.folder = folder;
    }
}
