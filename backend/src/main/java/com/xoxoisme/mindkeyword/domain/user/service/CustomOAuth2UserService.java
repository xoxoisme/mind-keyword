package com.xoxoisme.mindkeyword.domain.user.service;

import com.xoxoisme.mindkeyword.domain.user.entity.User;
import com.xoxoisme.mindkeyword.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // Naver 응답: { "resultcode": "00", "message": "success", "response": { "id": "...", "email": "...", "name": "..." } }
        Map<String, Object> response = oAuth2User.getAttribute("response");
        if (response == null) throw new OAuth2AuthenticationException("OAuthAPI response is null");
        String providerId = (String) response.get("id");
        String email     = (String) response.get("email");
        String name      = (String) response.get("name");

        // email이 null이면 providerId 기반 가상 이메일 사용
        String resolvedEmail = (email != null && !email.isBlank()) ? email : providerId + "@naver.local";

        User user = userRepository.findByProviderAndProviderId("naver", providerId)
                .orElseGet(() -> {
                    String nickname = resolveNickname(name, resolvedEmail);
                    return userRepository.save(User.createOAuth2("naver", providerId, resolvedEmail, nickname));
                });

        // userId 따로 저장
        Map<String, Object> attributes = new HashMap<>(response);
        attributes.put("userId", user.getId());

        return new DefaultOAuth2User(List.of(), attributes, "userId");
    }

    // TODO: DB 조회 많아서 이후에 쿼리로 한번에 가져오도록 수정 필요해 보인다.
    private String resolveNickname(String name, String email) {
        String base = (name != null && !name.isBlank()) ? name : email.split("@")[0];
        // 닉네임 중복 시 숫자 suffix
        String candidate = base.length() > 20 ? base.substring(0, 20) : base;
        int suffix = 1;
        while (userRepository.existsByNickname(candidate)) {
            String s = String.valueOf(suffix++);
            candidate = base.substring(0, Math.min(base.length(), 20 - s.length())) + s;
        }
        return candidate;
    }
}
