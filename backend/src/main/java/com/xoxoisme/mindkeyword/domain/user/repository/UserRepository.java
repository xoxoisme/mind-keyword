package com.xoxoisme.mindkeyword.domain.user.repository;

import com.xoxoisme.mindkeyword.domain.user.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(@Email @NotBlank String email);
    Optional<User> findByEmail(@Email @NotBlank String email);
    Optional<User> findByProviderAndProviderId(String provider, String providerId);
}
