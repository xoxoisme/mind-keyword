package com.xoxoisme.mindkeyword.domain.user.service;

import com.xoxoisme.mindkeyword.domain.user.dto.request.LoginRequest;
import com.xoxoisme.mindkeyword.domain.user.dto.request.SignupRequest;
import com.xoxoisme.mindkeyword.domain.user.dto.response.TokenResponse;
import com.xoxoisme.mindkeyword.domain.user.entity.RefreshToken;
import com.xoxoisme.mindkeyword.domain.user.entity.User;
import com.xoxoisme.mindkeyword.domain.user.repository.RefreshTokenRepository;
import com.xoxoisme.mindkeyword.domain.user.repository.UserRepository;
import com.xoxoisme.mindkeyword.global.common.exception.BusinessException;
import com.xoxoisme.mindkeyword.global.common.exception.ErrorCode;
import com.xoxoisme.mindkeyword.global.jwt.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailVerificationService emailVerificationService;
    private final RefreshTokenRepository refreshTokenRepository;

    public void signup(SignupRequest request) {
        if (!emailVerificationService.isVerified(request.email())) {
            throw new BusinessException(ErrorCode.EMAIL_NOT_VERIFIED);
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        User user = User.create(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.nickname()
        );
        userRepository.save(user);
        emailVerificationService.consumeVerified(request.email());
    }

    @Transactional
    public TokenResponse login(@Valid LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
        }
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        refreshTokenRepository.save(new RefreshToken(
                user.getId(),
                refreshToken,
                LocalDateTime.now().plusDays(30)
        ));
        return new TokenResponse(accessToken, refreshToken);
    }

    public TokenResponse refresh(String refreshToken) {
        if (!jwtTokenProvider.validate(refreshToken)) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }

        Long userId = jwtTokenProvider.getUserId(refreshToken);
        RefreshToken saved = refreshTokenRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TOKEN_NOT_FOUND));

        if (!saved.getToken().equals(refreshToken)){
            throw new BusinessException(ErrorCode.TOKEN_NOT_SAME);
        }

        String newAccessToken = jwtTokenProvider.generateAccessToken(userId);
        return new TokenResponse(newAccessToken, refreshToken);
    }

    @Transactional
    public void logout(String refreshToken) {
        try {
            Long userId = jwtTokenProvider.getUserId(refreshToken);
            refreshTokenRepository.deleteByUserId(userId);
        } catch (Exception ignored) {}
    }
}
