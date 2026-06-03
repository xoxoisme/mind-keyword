package com.xoxoisme.mindkeyword.domain.user.oauth2;

import org.springframework.security.oauth2.core.OAuth2AuthenticationException;

import java.util.Map;

public class OAuth2UserInfoFactory {

    public static OAuth2UserInfo of(String registrationId, Map<String, Object> attributes) {
        return switch (registrationId) {
            case "naver"  -> new NaverOAuth2UserInfo(attributes);
            case "google" -> new GoogleOAuth2UserInfo(attributes);
            case "kakao"  -> new KakaoOAuth2UserInfo(attributes);
            default -> throw new OAuth2AuthenticationException("지원하지 않는 OAuth2 프로바이더: " + registrationId);
        };
    }
}
