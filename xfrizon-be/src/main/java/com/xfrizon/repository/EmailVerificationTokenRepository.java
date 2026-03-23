package com.xfrizon.repository;

import com.xfrizon.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByToken(String token);

    List<EmailVerificationToken> findByEmailAndIsUsedFalse(String email);

    long deleteByEmailAndIsUsedFalse(String email);

    long deleteByUser_Id(Long userId);

    List<EmailVerificationToken> findByEmailAndIsUsedTrue(String email);

    Optional<EmailVerificationToken> findFirstByEmailAndIsUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String email,
            LocalDateTime now
    );

    // Find all expired tokens for cleanup
    @Query("SELECT t FROM EmailVerificationToken t WHERE t.expiresAt < CURRENT_TIMESTAMP AND t.isUsed = false")
    List<EmailVerificationToken> findExpiredTokens();

    // Delete all expired tokens
    @Modifying
    @Query("DELETE FROM EmailVerificationToken t WHERE t.expiresAt < CURRENT_TIMESTAMP AND t.isUsed = false")
    int deleteExpiredTokens();
}
