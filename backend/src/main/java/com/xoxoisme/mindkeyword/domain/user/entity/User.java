package com.xoxoisme.mindkeyword.domain.user.entity;

import com.xoxoisme.mindkeyword.global.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

@Getter
@Entity
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    @Column(nullable = false, length = 100, unique = true)
    private String email;

    @Column(length = 60)
    private String password;

    @Column(nullable = false, length = 20)
    private String nickname;

    @Column(length = 20)
    private String provider;

    @Column(length = 255)
    private String providerId;

    public static User create(String email, String password, String nickname) {
        User user = new User();
        user.email = email;
        user.password = password;
        user.nickname = nickname;
        user.provider = "local";
        return user;
    }

    public static User createOAuth2(String provider, String providerId, String email, String nickname) {
        User user = new User();
        user.provider = provider;
        user.providerId = providerId;
        user.email = email;
        user.nickname = nickname;
        return user;
    }
}
