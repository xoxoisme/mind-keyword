package com.xoxoisme.mindkeyword.domain.folder.entity;

import com.xoxoisme.mindkeyword.domain.user.entity.User;
import com.xoxoisme.mindkeyword.global.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "folder")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Folder extends BaseTimeEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Folder parent;  // null = 루트 폴더

    @Column(nullable = false, length = 30)
    private String name;

    public static Folder create(User user, String name) {
        Folder folder = new Folder();
        folder.user = user;
        folder.name = name;
        return folder;
    }

    // TODO: 하위 폴더 생성 시 사용
    public static Folder createSub(User user, String name, Folder parent) {
        Folder folder = new Folder();
        folder.user = user;
        folder.name = name;
        folder.parent = parent;
        return folder;
    }

    public void rename(String name) {
        this.name = name;
    }

    // TODO: 부모 폴더 변경 (삭제 시 자식을 상위로 올릴 때 사용)
    public void updateParent(Folder parent) {
        this.parent = parent;
    }
}
