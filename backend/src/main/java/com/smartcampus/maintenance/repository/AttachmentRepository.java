package com.smartcampus.maintenance.repository;

import com.smartcampus.maintenance.model.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    Optional<Attachment> findByTicket_IdAndStoredName(Long ticketId, String storedName);
}