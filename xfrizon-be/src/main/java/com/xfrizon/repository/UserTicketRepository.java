package com.xfrizon.repository;

import com.xfrizon.entity.UserTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTicketRepository extends JpaRepository<UserTicket, Long> {

    Page<UserTicket> findByUserId(Long userId, Pageable pageable);

    List<UserTicket> findByUserIdOrderByPurchaseDateDesc(Long userId);

    Page<UserTicket> findByEventId(Long eventId, Pageable pageable);

    List<UserTicket> findByEventIdAndStatus(Long eventId, UserTicket.TicketStatus status);

    @Query("SELECT COUNT(ut) FROM UserTicket ut WHERE ut.user.id = ?1 AND ut.event.id = ?2")
    Long countUserEventTickets(Long userId, Long eventId);

    Optional<UserTicket> findByIdAndUserId(Long id, Long userId);

    Optional<UserTicket> findByValidationCodeIgnoreCase(String validationCode);

    @Query("SELECT SUM(ut.quantity) FROM UserTicket ut WHERE ut.ticketTier.id = ?1")
    Integer sumQuantityByTicketTierId(Long ticketTierId);

    @Query("SELECT ut FROM UserTicket ut WHERE ut.user.id = ?1 AND ut.event.id = ?2 ORDER BY ut.purchaseDate DESC")
    List<UserTicket> findUserEventTickets(Long userId, Long eventId);

    @Query("SELECT ut FROM UserTicket ut WHERE ut.user.id = ?1 AND ut.paymentIntentId = ?2 ORDER BY ut.purchaseDate DESC")
    List<UserTicket> findByUserIdAndPaymentIntentId(Long userId, String paymentIntentId);

    @Query("SELECT ut FROM UserTicket ut WHERE ut.paymentIntentId = ?1 ORDER BY ut.purchaseDate DESC")
    List<UserTicket> findByPaymentIntentId(String paymentIntentId);

    @Query("SELECT SUM(ut.quantity) FROM UserTicket ut WHERE ut.paymentIntentId = ?1")
    Integer sumQuantityByPaymentIntentId(String paymentIntentId);

    @Query("SELECT ut FROM UserTicket ut WHERE ut.event.organizer.id = ?1 ORDER BY ut.purchaseDate DESC")
    List<UserTicket> findRecentTicketsByOrganizerIdDesc(Long organizerId);

    @Query("SELECT ut FROM UserTicket ut WHERE ut.event.organizer.id = ?1 ORDER BY ut.purchaseDate DESC")
    Page<UserTicket> findRecentTicketsByOrganizerId(Long organizerId, Pageable pageable);
    @Query("SELECT COALESCE(SUM(ut.quantity), 0) FROM UserTicket ut WHERE ut.user.id = ?1 AND ut.status <> com.xfrizon.entity.UserTicket.TicketStatus.CANCELLED")
    Integer sumPurchasedQuantityByUserId(Long userId);
}
