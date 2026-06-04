package com.xoxoisme.mindkeyword.domain.user.repository;

import com.xoxoisme.mindkeyword.domain.user.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    void deletedByUserId(Long userId);
}
