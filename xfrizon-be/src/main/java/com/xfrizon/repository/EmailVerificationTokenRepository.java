package com.xfrizon.repository;

import com.xfrizon.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByToken(String token);

    Optional<EmailVerificationToken> findByEmailAndIsUsedFalse(String email);

    List<EmailVerificationToken> findByEmailAndIsUsedTrue(String email);

    // Find valid token (not expired and not used) by email
    @Query("SELECT t FROM EmailVerificationToken t WHERE t.email = :email AND t.isUsed = false AND t.expiresAt > CURRENT_TIMESTAMP ORDER BY t.createdAt DESC LIMIT 1")
    Optional<EmailVerificationToken> findValidTokenByEmail(@Param("email") String email);

    // Find all expired tokens for cleanup
    @Query("SELECT t FROM EmailVerificationToken t WHERE t.expiresAt < CURRENT_TIMESTAMP AND t.isUsed = false")
    List<EmailVerificationToken> findExpiredTokens();

    // Delete all expired tokens
    @Query("DELETE FROM EmailVerificationToken t WHERE t.expiresAt < CURRENT_TIMESTAMP AND t.isUsed = false")
    void deleteExpiredTokens();
}
