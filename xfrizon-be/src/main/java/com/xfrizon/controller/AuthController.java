package com.xfrizon.controller;

import com.xfrizon.dto.LoginRequest;
import com.xfrizon.dto.RegisterRequest;
import com.xfrizon.dto.AuthResponse;
import com.xfrizon.dto.GoogleSignupCompleteRequest;
import com.xfrizon.dto.UserResponse;
import com.xfrizon.service.AuthService;
import com.xfrizon.util.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@AllArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5177", "http://localhost:3000"}, maxAge = 3600)
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        if (response.getSuccess()) {
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @PostMapping("/register-organizer")
    public ResponseEntity<AuthResponse> registerOrganizer(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.registerOrganizer(request);
        if (response.getSuccess()) {
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @PostMapping("/register-admin")
    public ResponseEntity<AuthResponse> registerAdmin(
            @Valid @RequestBody RegisterRequest request,
            @RequestHeader(value = "X-Admin-Secret-Key", required = false) String adminSecretKey) {
        AuthResponse response = authService.registerAdmin(request, adminSecretKey);
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

    @PostMapping("/admin-login")
    public ResponseEntity<AuthResponse> adminLogin(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.loginAdmin(request);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @PostMapping("/oauth/google/complete-signup")
    public ResponseEntity<AuthResponse> completeGoogleSignup(
            @Valid @RequestBody GoogleSignupCompleteRequest request
    ) {
        AuthResponse response = authService.completeGoogleSignup(request);
        if (Boolean.TRUE.equals(response.getSuccess())) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
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

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserResponse> getUserProfile(@PathVariable Long userId) {
        try {
            UserResponse user = authService.getUserById(userId);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            return ResponseEntity.ok(user);
        } catch (Exception e) {
            System.err.println("Error fetching user profile: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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

        try {
            // Convert response to entity for update
            com.xfrizon.entity.User userEntity = new com.xfrizon.entity.User();
            userEntity.setFirstName(updateData.getFirstName());
            userEntity.setLastName(updateData.getLastName());
            userEntity.setPhoneNumber(updateData.getPhoneNumber());
            userEntity.setLocation(updateData.getLocation());
            userEntity.setProfilePicture(updateData.getProfilePicture());
            userEntity.setBio(updateData.getBio());
            userEntity.setCoverPhoto(updateData.getCoverPhoto());

            // Convert favoriteArtists list to JSON string
            if (updateData.getFavoriteArtists() != null && !updateData.getFavoriteArtists().isEmpty()) {
                userEntity.setFavoriteArtists(objectMapper.writeValueAsString(updateData.getFavoriteArtists()));
            }

            // Convert media list to JSON string
            if (updateData.getMedia() != null && !updateData.getMedia().isEmpty()) {
                userEntity.setMedia(objectMapper.writeValueAsString(updateData.getMedia()));
            }

            UserResponse updatedUser = authService.updateUser(userId, userEntity);

            if (updatedUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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
