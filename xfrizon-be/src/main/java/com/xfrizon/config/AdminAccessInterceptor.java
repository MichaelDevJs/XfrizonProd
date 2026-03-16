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

        if (user.getRole() != User.UserRole.ADMIN) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN, "Admin role required");
            return false;
        }

        return true;
    }

    private void writeError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"success\":false,\"message\":\"" + message + "\"}");
    }
}
