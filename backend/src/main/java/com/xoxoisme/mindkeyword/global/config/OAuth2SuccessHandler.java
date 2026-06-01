package com.xoxoisme.mindkeyword.global.config;

import com.xoxoisme.mindkeyword.global.jwt.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final String FRONTEND_URL = "http://localhost:5173";
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Number userIdAttr = oAuth2User.getAttribute("userId");
        if (userIdAttr == null) throw new IllegalStateException("userId attribute not found");
        Long userId = userIdAttr.longValue();
        String token = jwtTokenProvider.generateToken(userId);
        getRedirectStrategy().sendRedirect(request, response, FRONTEND_URL + "?token=" + token);
    }
}
