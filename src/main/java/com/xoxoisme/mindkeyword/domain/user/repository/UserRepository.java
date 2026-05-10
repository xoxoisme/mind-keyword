package com.xoxoisme.mindkeyword.domain.user.repository;

import com.xoxoisme.mindkeyword.domain.user.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(@Email @NotBlank String email);
    boolean existsByNickname(@NotBlank @Size(max = 20) String nickname);
}
