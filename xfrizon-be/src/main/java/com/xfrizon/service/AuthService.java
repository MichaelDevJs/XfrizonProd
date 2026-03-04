package com.xfrizon.service;

import com.xfrizon.dto.LoginRequest;
import com.xfrizon.dto.RegisterRequest;
import com.xfrizon.dto.AuthResponse;
import com.xfrizon.dto.UserResponse;
import com.xfrizon.entity.User;
import com.xfrizon.repository.UserRepository;
import com.xfrizon.util.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import java.util.List;

@Service
@AllArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper;

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
                .profilePicture(request.getProfilePicture())
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

    public AuthResponse registerOrganizer(RegisterRequest request) {
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

        // Create new organizer user
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .profilePicture(request.getProfilePicture())
                .role(User.UserRole.ORGANIZER)
                .isActive(true)
                .isEmailVerified(false)
                .build();

        User savedUser = userRepository.save(user);

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(savedUser.getEmail(), savedUser.getId());

        return AuthResponse.builder()
                .success(true)
                .message("Organizer registered successfully")
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
                .name(user.getName())
                .role(user.getRole().toString())
                .logo(user.getLogo() != null ? user.getLogo() : user.getProfilePicture())
                .profilePicture(user.getProfilePicture() != null ? user.getProfilePicture() : user.getLogo())
                .phoneNumber(user.getPhoneNumber())
                .location(user.getLocation())
                .address(user.getAddress())
                .bio(user.getBio())
                .coverPhoto(user.getCoverPhoto())
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
        if (updateData.getAddress() != null) {
            user.setAddress(updateData.getAddress());
        }
        if (updateData.getProfilePicture() != null) {
            user.setProfilePicture(updateData.getProfilePicture());
        }
        if (updateData.getLogo() != null) {
            user.setLogo(updateData.getLogo());
        }
        if (updateData.getBio() != null) {
            user.setBio(updateData.getBio());
        }
        if (updateData.getCoverPhoto() != null) {
            user.setCoverPhoto(updateData.getCoverPhoto());
        }
        if (updateData.getName() != null) {
            user.setName(updateData.getName());
        }
        if (updateData.getFavoriteArtists() != null) {
            user.setFavoriteArtists(updateData.getFavoriteArtists());
        }
        if (updateData.getMedia() != null) {
            user.setMedia(updateData.getMedia());
        }

        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    private UserResponse mapToUserResponse(User user) {
        List<String> favoriteArtists = null;
        List<UserResponse.MediaItem> media = null;

        // Parse favorite artists with comprehensive error handling
        if (user.getFavoriteArtists() != null && !user.getFavoriteArtists().isEmpty()) {
            try {
                favoriteArtists = objectMapper.readValue(user.getFavoriteArtists(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
            } catch (Exception e) {
                System.err.println("Error parsing favoriteArtists JSON: " + e.getMessage());
                // If parsing fails, split by comma or return empty list
                try {
                    if (user.getFavoriteArtists().contains(",")) {
                        favoriteArtists = Arrays.asList(user.getFavoriteArtists().split(","));
                    } else {
                        favoriteArtists = List.of(user.getFavoriteArtists().trim());
                    }
                } catch (Exception fallbackEx) {
                    favoriteArtists = List.of();
                }
            }
        } else {
            favoriteArtists = List.of();
        }

        // Parse media with comprehensive error handling
        if (user.getMedia() != null && !user.getMedia().isEmpty()) {
            try {
                media = objectMapper.readValue(user.getMedia(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, UserResponse.MediaItem.class));
            } catch (Exception e) {
                System.err.println("Error parsing media JSON: " + e.getMessage());
                // If parsing fails, return empty list
                media = List.of();
            }
        } else {
            media = List.of();
        }

        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .location(user.getLocation())
                .address(user.getAddress())
                .profilePicture(user.getProfilePicture())
                .logo(user.getLogo() != null ? user.getLogo() : user.getProfilePicture())
                .bio(user.getBio() != null ? user.getBio() : "")
                .coverPhoto(user.getCoverPhoto() != null ? user.getCoverPhoto() : "")
                .name(user.getName())
                .favoriteArtists(favoriteArtists)
                .media(media)
                .role(user.getRole().toString())
                .isActive(user.getIsActive())
                .isEmailVerified(user.getIsEmailVerified())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
