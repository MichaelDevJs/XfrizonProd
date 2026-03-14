package com.xfrizon.repository;

import com.xfrizon.entity.PartnerOffer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PartnerOfferRepository extends JpaRepository<PartnerOffer, Long> {
    List<PartnerOffer> findByPartnerIdAndIsActiveTrueOrderByPointsCostAsc(Long partnerId);
}
