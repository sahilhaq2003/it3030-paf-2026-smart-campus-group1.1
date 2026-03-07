package com.smartcampus.maintenance.repository;

import com.smartcampus.maintenance.model.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {}