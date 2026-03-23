package com.xfrizon.repository;

import com.xfrizon.entity.User;
import com.xfrizon.entity.Event;
import com.xfrizon.entity.UserEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserEventRepository extends JpaRepository<UserEvent, Long> {

    long deleteByUserId(Long userId);

    @Query("SELECT CASE WHEN COUNT(ue) > 0 THEN true ELSE false END FROM UserEvent ue WHERE ue.user.id = :userId AND ue.event.id = :eventId")
    boolean existsByUserIdAndEventId(@Param("userId") Long userId, @Param("eventId") Long eventId);

    @Query("SELECT ue FROM UserEvent ue WHERE ue.user.id = :userId AND ue.event.id = :eventId")
    Optional<UserEvent> findByUserIdAndEventId(@Param("userId") Long userId, @Param("eventId") Long eventId);

    @Query("SELECT ue.event FROM UserEvent ue WHERE ue.user.id = :userId ORDER BY ue.createdAt DESC")
    List<Event> findSavedEventsByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(ue) FROM UserEvent ue WHERE ue.event.id = :eventId")
    long countByEventId(@Param("eventId") Long eventId);

    @Query("SELECT ue FROM UserEvent ue WHERE ue.event.id = :eventId")
    List<UserEvent> findByEventId(@Param("eventId") Long eventId);
}
