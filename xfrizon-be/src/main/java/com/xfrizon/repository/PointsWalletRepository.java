package com.xfrizon.repository;

import com.xfrizon.entity.PointsWallet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PointsWalletRepository extends JpaRepository<PointsWallet, Long> {
    Optional<PointsWallet> findByUserId(Long userId);
}
