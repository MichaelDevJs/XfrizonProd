package com.xfrizon.service;

import com.xfrizon.dto.LoginRequest;
import com.xfrizon.dto.RegisterRequest;
import com.xfrizon.dto.AuthResponse;
import com.xfrizon.dto.UserResponse;
import com.xfrizon.entity.User;
import com.xfrizon.repository.UserRepository;
import com.xfrizon.util.JwtTokenProvider;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Email already registered")
                    .build();
        }

        // Verify passwords match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Passwords do not match")
                    .build();
        }

        // Create new user
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(User.UserRole.USER)
                .isActive(true)
                .isEmailVerified(false)
                .build();

        User savedUser = userRepository.save(user);

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(savedUser.getEmail(), savedUser.getId());

        return AuthResponse.builder()
                .success(true)
                .message("User registered successfully")
                .token(token)
                .type("Bearer")
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .role(savedUser.getRole().toString())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);

        if (user == null) {
            return AuthResponse.builder()
                    .success(false)
                    .message("User not found")
                    .build();
        }

        // Check if user is active
        if (!user.getIsActive()) {
            return AuthResponse.builder()
                    .success(false)
                    .message("User account is inactive")
                    .build();
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Invalid password")
                    .build();
        }

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getId());

        return AuthResponse.builder()
                .success(true)
                .message("Login successful")
                .token(token)
                .type("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().toString())
                .build();
    }

    public UserResponse getUserById(Long userId) {
        User user = userRepository.findByIdAndIsActiveTrue(userId)
                .orElse(null);

        if (user == null) {
            return null;
        }

        return mapToUserResponse(user);
    }

    public UserResponse updateUser(Long userId, User updateData) {
        User user = userRepository.findByIdAndIsActiveTrue(userId)
                .orElse(null);

        if (user == null) {
            return null;
        }

        if (updateData.getFirstName() != null) {
            user.setFirstName(updateData.getFirstName());
        }
        if (updateData.getLastName() != null) {
            user.setLastName(updateData.getLastName());
        }
        if (updateData.getPhoneNumber() != null) {
            user.setPhoneNumber(updateData.getPhoneNumber());
        }
        if (updateData.getLocation() != null) {
            user.setLocation(updateData.getLocation());
        }
        if (updateData.getProfilePicture() != null) {
            user.setProfilePicture(updateData.getProfilePicture());
        }

        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .location(user.getLocation())
                .profilePicture(user.getProfilePicture())
                .role(user.getRole().toString())
                .isActive(user.getIsActive())
                .isEmailVerified(user.getIsEmailVerified())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
