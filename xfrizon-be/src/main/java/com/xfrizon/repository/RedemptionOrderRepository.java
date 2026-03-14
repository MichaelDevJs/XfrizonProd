package com.xfrizon.repository;

import com.xfrizon.entity.RedemptionOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RedemptionOrderRepository extends JpaRepository<RedemptionOrder, Long> {
    Optional<RedemptionOrder> findByToken(String token);
    Page<RedemptionOrder> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    long countByUserIdAndCreatedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);
}
