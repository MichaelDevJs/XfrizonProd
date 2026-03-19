package com.xfrizon.config;

import com.xfrizon.dto.AuthResponse;
import com.xfrizon.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@Slf4j
@RequiredArgsConstructor
public class GoogleOAuthHandlers implements AuthenticationSuccessHandler, AuthenticationFailureHandler {

    private final AuthService authService;

    @Value("${xfrizon.oauth.google.frontend-complete-url:http://localhost:5173/auth/google/complete}")
    private String frontendCompleteUrl;

    @Value("${xfrizon.oauth.google.frontend-login-url:http://localhost:5173/auth/login}")
    private String frontendLoginUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        if (!(authentication.getPrincipal() instanceof OAuth2User oauthUser)) {
            redirectFailure(response, "google_auth_failed");
            return;
        }

        String email = stringAttr(oauthUser, "email");
        if (email.isBlank()) {
            redirectFailure(response, "google_email_missing");
            return;
        }

        String firstName = stringAttr(oauthUser, "given_name");
        String lastName = stringAttr(oauthUser, "family_name");
        String profilePicture = stringAttr(oauthUser, "picture");
        String requestedAccountType = normalizeAccountType(request.getParameter("accountType"));
        String callbackOverride = safeTrim(request.getParameter("redirect_uri"));

        if (firstName.isBlank() || lastName.isBlank()) {
            String displayName = stringAttr(oauthUser, "name").trim();
            if (!displayName.isBlank()) {
                String[] parts = displayName.split("\\s+", 2);
                if (firstName.isBlank()) {
                    firstName = parts[0];
                }
                if (lastName.isBlank()) {
                    lastName = parts.length > 1 ? parts[1] : "User";
                }
            }
        }

        AuthResponse authResult = authService.loginOrPrepareGoogleSignup(
            email,
            firstName,
            lastName,
            profilePicture,
            requestedAccountType
        );

        if (!Boolean.TRUE.equals(authResult.getSuccess())) {
            redirectFailure(response, "google_signin_rejected");
            return;
        }

        boolean completionRequired = authResult.getUserId() == null;

        UriComponentsBuilder builder = UriComponentsBuilder
            .fromUriString(resolveCompleteUrl(callbackOverride))
                .queryParam("email", authResult.getEmail())
                .queryParam("firstName", authResult.getFirstName())
                .queryParam("lastName", authResult.getLastName())
                .queryParam("accountType", authResult.getRole())
                .queryParam("needsProfileCompletion", completionRequired);

        if (completionRequired) {
            builder.queryParam("signupToken", authResult.getToken());
        } else {
            builder.queryParam("token", authResult.getToken());
        }

        response.sendRedirect(builder.build().encode().toUriString());
    }

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            org.springframework.security.core.AuthenticationException exception
    ) throws IOException, ServletException {
        String normalizedReason = mapFailureReason(exception);
        log.warn("Google OAuth authentication failed: reason={}, message={}", normalizedReason, safeTrim(exception == null ? "" : exception.getMessage()));
        redirectFailure(response, normalizedReason);
    }

    private void redirectFailure(HttpServletResponse response, String code) throws IOException {
        String redirectUrl = UriComponentsBuilder
                .fromUriString(frontendLoginUrl)
                .queryParam("error", code)
                .build()
                .encode()
                .toUriString();
        response.sendRedirect(redirectUrl);
    }

    private String resolveCompleteUrl(String callbackOverride) {
        if (!callbackOverride.isBlank() && callbackOverride.startsWith("http")) {
            return callbackOverride;
        }
        return frontendCompleteUrl;
    }

    private String normalizeAccountType(String accountType) {
        String normalized = safeTrim(accountType).toUpperCase();
        if ("ORGANIZER".equals(normalized)) {
            return "ORGANIZER";
        }
        return "USER";
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }

    private String mapFailureReason(org.springframework.security.core.AuthenticationException exception) {
        String rawMessage = safeTrim(exception == null ? "" : exception.getMessage()).toLowerCase();

        if (rawMessage.contains("invalid_client")) {
            return "google_invalid_client";
        }
        if (rawMessage.contains("redirect_uri_mismatch")) {
            return "google_redirect_mismatch";
        }
        if (rawMessage.contains("invalid_grant")) {
            return "google_invalid_grant";
        }
        if (rawMessage.contains("access_denied")) {
            return "google_access_denied";
        }

        return "google_auth_failed";
    }

    private String stringAttr(OAuth2User user, String key) {
        Object value = user.getAttributes().get(key);
        return value == null ? "" : String.valueOf(value).trim();
    }
}
