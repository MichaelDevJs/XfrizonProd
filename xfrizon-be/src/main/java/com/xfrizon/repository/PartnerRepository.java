package com.xfrizon.repository;

import com.xfrizon.entity.Partner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PartnerRepository extends JpaRepository<Partner, Long> {
    List<Partner> findByIsActiveTrueOrderByNameAsc();
    List<Partner> findByCategoryAndIsActiveTrueOrderByNameAsc(Partner.PartnerCategory category);
    List<Partner> findByIsActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc(String name);
    List<Partner> findAllByOrderByCreatedAtDesc();
    Optional<Partner> findFirstByContactEmailIgnoreCase(String contactEmail);
}
