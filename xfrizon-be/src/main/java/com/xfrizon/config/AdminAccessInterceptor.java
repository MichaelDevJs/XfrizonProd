package com.xfrizon.config;

import com.xfrizon.entity.User;
import com.xfrizon.repository.UserRepository;
import com.xfrizon.util.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class AdminAccessInterceptor implements HandlerInterceptor {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String bearerToken = request.getHeader("Authorization");
        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Missing or invalid Authorization header");
            return false;
        }

        String token = bearerToken.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired token");
            return false;
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        User user = userRepository.findById(userId).orElse(null);

        if (user == null || !Boolean.TRUE.equals(user.getIsActive())) {
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "User not found or inactive");
            return false;
        }

        if (!hasAdminApiAccess(user, request.getRequestURI())) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN, "Insufficient permissions for this admin endpoint");
            return false;
        }

        return true;
    }

    private boolean hasAdminApiAccess(User user, String requestUri) {
        Set<String> roleTokens = collectRoleTokens(user);

        if (roleTokens.contains("ADMIN")) {
            return true;
        }

        // BLOG_WRITER has strict backend access to blog-related admin endpoints only.
        if (roleTokens.contains("BLOG_WRITER")) {
            return isBlogWriterAllowedPath(requestUri);
        }

        return false;
    }

    private Set<String> collectRoleTokens(User user) {
        Set<String> roles = new LinkedHashSet<>();

        if (user.getRole() != null) {
            roles.add(user.getRole().name().toUpperCase(Locale.ROOT));
        }

        if (user.getRoles() != null && !user.getRoles().isBlank()) {
            for (String token : user.getRoles().split(",")) {
                String normalized = token == null ? "" : token.trim().toUpperCase(Locale.ROOT);
                if (!normalized.isBlank()) {
                    roles.add(normalized);
                }
            }
        }

        return roles;
    }

    private boolean isBlogWriterAllowedPath(String uri) {
        if (uri == null) return false;

        return uri.startsWith("/api/v1/admin/upload")
            || uri.startsWith("/api/v1/admin/blogs")
            || uri.startsWith("/api/v1/admin/blog-hero")
            || uri.startsWith("/api/v1/admin/blog-hero-blocks");
    }

    private void writeError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"success\":false,\"message\":\"" + message + "\"}");
    }
}
