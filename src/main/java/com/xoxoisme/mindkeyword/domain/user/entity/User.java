package com.xoxoisme.mindkeyword.domain.user.entity;

import com.xoxoisme.mindkeyword.global.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.*;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    @Column(nullable = false, length = 100, unique = true)
    private String email;

    @Column(nullable = false, length = 60)
    private String password;

    @Column(nullable = false, length = 20)
    private String nickname;

    public static User create(String email, String password, String nickname) {
        User user = new User();
        user.email = email;
        user.password = password;
        user.nickname = nickname;
        return user;
    }
}
