package com.xoxoisme.mindkeyword.domain.user.service;

import com.xoxoisme.mindkeyword.domain.user.entity.User;
import com.xoxoisme.mindkeyword.domain.user.oauth2.OAuth2UserInfo;
import com.xoxoisme.mindkeyword.domain.user.oauth2.OAuth2UserInfoFactory;
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

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.of(registrationId, oAuth2User.getAttributes());

        String providerId = userInfo.getProviderId();
        String email = userInfo.getEmail();
        String name = userInfo.getName();

        String resolvedEmail = (email != null && !email.isBlank()) ? email : providerId + "@" + registrationId + ".local";

        User user = userRepository.findByProviderAndProviderId(registrationId, providerId)
                .orElseGet(() -> {
                    String nickname = resolveNickname(name, resolvedEmail);
                    return userRepository.save(User.createOAuth2(registrationId, providerId, resolvedEmail, nickname));
                });

        Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes());
        attributes.put("userId", user.getId());

        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        return new DefaultOAuth2User(List.of(), attributes, userNameAttributeName);
    }

    private String resolveNickname(String name, String email) {
        String base = (name != null && !name.isBlank()) ? name : email.split("@")[0];
        return base.length() > 20 ? base.substring(0, 20) : base;
    }
}
