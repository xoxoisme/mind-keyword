package com.xoxoisme.mindkeyword.domain.user.service;

import com.xoxoisme.mindkeyword.domain.user.dto.request.EmailConfirmRequestDto;
import com.xoxoisme.mindkeyword.domain.user.dto.request.EmailVerifyRequestDto;
import com.xoxoisme.mindkeyword.global.common.exception.BusinessException;
import com.xoxoisme.mindkeyword.global.common.exception.ErrorCode;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final String CODE_PREFIX = "email:code:";
    private static final String VERIFIED_PREFIX = "email:verified:";
    private static final Duration CODE_TTL = Duration.ofMinutes(5);
    private static final Duration VERIFIED_TTL = Duration.ofMinutes(10);

    private final JavaMailSender mailSender;
    private final StringRedisTemplate redisTemplate;

    public void sendCode(EmailVerifyRequestDto request) {
        String code = generateCode();
        redisTemplate.opsForValue().set(CODE_PREFIX + request.email(), code, CODE_TTL);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(request.email());
            helper.setSubject("[Mind Keyword] 이메일 인증을 위한 인증번호를 안내 드립니다.");
            helper.setText(buildHtml(code), true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new BusinessException(ErrorCode.EMAIL_SEND_FAILED);
        }
    }

    public void confirmCode(EmailConfirmRequestDto request) {
        String key = CODE_PREFIX + request.email();
        String stored = redisTemplate.opsForValue().get(key);

        if (stored == null) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFY_CODE_EXPIRED);
        }
        if (!stored.equals(request.code())) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFY_CODE_INVALID);
        }

        redisTemplate.delete(key);
        redisTemplate.opsForValue().set(VERIFIED_PREFIX + request.email(), "1", VERIFIED_TTL);
    }

    private String generateCode() {
        return String.format("%06d", new Random().nextInt(1000000));
    }

    public boolean isVerified(String email) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(VERIFIED_PREFIX + email));
    }

    public void consumeVerified(String email) {
        redisTemplate.delete(VERIFIED_PREFIX + email);
    }

    private String buildHtml(String code) {
        return """
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
            <table width="100%%" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        <table width="480" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                            
                            <!-- 헤더 -->
                            <tr>
                                <td style="background: #1a1a1a; padding: 32px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Mind Keyword</h1>
                                </td>
                            </tr>
                            
                            <!-- 본문 -->
                            <tr>
                                <td style="padding: 40px 32px;">
                                    <p style="color: #1a1a1a; font-size: 18px; font-weight: bold; margin: 0 0 8px;">이메일 인증 코드</p>
                                    <p style="color: #666; font-size: 14px; margin: 0 0 32px;">아래 인증 코드를 입력창에 입력해주세요.</p>
                                    
                                    <!-- 인증코드 박스 -->
                                    <div style="background: #f5f5f5; border-radius: 8px; padding: 28px; text-align: center; margin-bottom: 32px;">
                                        <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #1a1a1a;">%s</span>
                                    </div>
                                    
                                    <p style="color: #999; font-size: 13px; margin: 0 0 8px;">⏱ 인증 코드는 <b>5분간</b> 유효합니다.</p>
                                    <p style="color: #999; font-size: 13px; margin: 0;">본인이 요청하지 않았다면 이 메일을 무시해주세요.</p>
                                </td>
                            </tr>
                            
                            <!-- 푸터 -->
                            <tr>
                                <td style="background: #f9f9f9; padding: 20px 32px; text-align: center; border-top: 1px solid #eeeeee;">
                                    <p style="color: #bbb; font-size: 12px; margin: 0;">© 2025 Mind Keyword. All rights reserved.</p>
                                </td>
                            </tr>
                            
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    """.formatted(code);
    }
}
