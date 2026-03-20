package com.xfrizon.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class OAuthRequestContextFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (isGoogleAuthorizationStartRequest(request)) {
            String redirectUri = safeTrim(request.getParameter("redirect_uri"));
            if (!redirectUri.isBlank() && redirectUri.startsWith("http")) {
                HttpSession session = request.getSession(true);
                session.setAttribute(GoogleOAuthHandlers.SESSION_REDIRECT_URI_ATTR, redirectUri);
            }

            String accountType = safeTrim(request.getParameter("accountType")).toUpperCase();
            if (!accountType.isBlank()) {
                HttpSession session = request.getSession(true);
                session.setAttribute(GoogleOAuthHandlers.SESSION_ACCOUNT_TYPE_ATTR, accountType);
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isGoogleAuthorizationStartRequest(HttpServletRequest request) {
        String path = safeTrim(request.getRequestURI());
        return path.endsWith("/oauth2/authorization/google") || path.equals("/oauth2/authorization/google");
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }
}