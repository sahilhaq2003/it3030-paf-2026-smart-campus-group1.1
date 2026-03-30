package com.smartcampus.notification.repository;

import com.smartcampus.notification.model.NotificationPreferences;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationPreferencesRepository
        extends JpaRepository<NotificationPreferences, Long> {

    Optional<NotificationPreferences> findByUser_Id(Long userId);
}

