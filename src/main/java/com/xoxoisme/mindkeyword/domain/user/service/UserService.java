package com.xoxoisme.mindkeyword.domain.user.service;

import com.xoxoisme.mindkeyword.domain.user.dto.request.SignupRequest;
import com.xoxoisme.mindkeyword.domain.user.entity.User;
import com.xoxoisme.mindkeyword.domain.user.repository.UserRepository;
import com.xoxoisme.mindkeyword.global.common.exception.BusinessException;
import com.xoxoisme.mindkeyword.global.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public void signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        if (userRepository.existsByNickname(request.nickname())) {
            throw new BusinessException(ErrorCode.NICKNAME_ALREADY_EXISTS);
        }

        User user = User.create(
                request.email(),
                request.password(),
                request.nickname()
        );
        userRepository.save(user);
    }
}
