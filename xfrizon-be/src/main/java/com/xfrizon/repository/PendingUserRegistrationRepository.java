package com.xfrizon.repository;

import com.xfrizon.entity.PendingUserRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PendingUserRegistrationRepository extends JpaRepository<PendingUserRegistration, Long> {

    Optional<PendingUserRegistration> findByEmailIgnoreCase(String email);

    Optional<PendingUserRegistration> findByEmailIgnoreCaseAndVerificationCode(String email, Integer verificationCode);

    long deleteByExpiresAtBefore(LocalDateTime now);
}
