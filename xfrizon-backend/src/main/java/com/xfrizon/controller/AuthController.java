package com.xfrizon.controller;

import com.xfrizon.dto.LoginRequest;
import com.xfrizon.dto.RegisterRequest;
import com.xfrizon.dto.AuthResponse;
import com.xfrizon.dto.UserResponse;
import com.xfrizon.service.AuthService;
import com.xfrizon.util.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@AllArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        if (response.getSuccess()) {
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @GetMapping("/user")
    public ResponseEntity<UserResponse> getCurrentUser(HttpServletRequest request) {
        String token = getTokenFromRequest(request);

        if (token == null || !jwtTokenProvider.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        UserResponse user = authService.getUserById(userId);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        return ResponseEntity.ok(user);
    }

    @PutMapping("/user")
    public ResponseEntity<UserResponse> updateUser(
            HttpServletRequest request,
            @RequestBody UserResponse updateData) {

        String token = getTokenFromRequest(request);

        if (token == null || !jwtTokenProvider.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(token);

        // Convert response to entity for update
        com.xfrizon.entity.User userEntity = new com.xfrizon.entity.User();
        userEntity.setFirstName(updateData.getFirstName());
        userEntity.setLastName(updateData.getLastName());
        userEntity.setPhoneNumber(updateData.getPhoneNumber());
        userEntity.setLocation(updateData.getLocation());
        userEntity.setProfilePicture(updateData.getProfilePicture());

        UserResponse updatedUser = authService.updateUser(userId, userEntity);

        if (updatedUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/validate-token")
    public ResponseEntity<Object> validateToken(HttpServletRequest request) {
        String token = getTokenFromRequest(request);

        if (token == null || !jwtTokenProvider.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new Object() {
                        public boolean valid = false;
                    });
        }

        return ResponseEntity.ok(new Object() {
            public boolean valid = true;
            public String email = jwtTokenProvider.getEmailFromToken(token);
            public Long userId = jwtTokenProvider.getUserIdFromToken(token);
        });
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
