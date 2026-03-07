package com.smartcampus.maintenance.service;

import com.smartcampus.maintenance.model.Attachment;
import com.smartcampus.maintenance.model.Ticket;
import com.smartcampus.maintenance.repository.AttachmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentRepository attachmentRepo;

    @Value("${app.upload.dir:uploads/tickets}")
    private String uploadDir;

    private static final Set<String> ALLOWED_TYPES = Set.of(
        "image/jpeg", "image/png", "image/webp"
    );
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final int MAX_FILES = 3;

    public List<Attachment> saveAttachments(List<MultipartFile> files, Ticket ticket) {
        if (files.size() > MAX_FILES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Maximum " + MAX_FILES + " attachments allowed");
        }

        List<Attachment> saved = new ArrayList<>();

        for (MultipartFile file : files) {
            validateFile(file);

            String storedName = UUID.randomUUID() + getExtension(file.getOriginalFilename());
            Path dir = Paths.get(uploadDir, String.valueOf(ticket.getId()));

            try {
                Files.createDirectories(dir);
                Files.copy(file.getInputStream(), dir.resolve(storedName),
                    StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to store file: " + file.getOriginalFilename());
            }

            var attachment = Attachment.builder()
                .ticket(ticket)
                .originalName(file.getOriginalFilename())
                .storedName(storedName)
                .mimeType(file.getContentType())
                .size(file.getSize())
                .build();

            saved.add(attachmentRepo.save(attachment));
        }

        return saved;
    }

    public byte[] serveFile(Long ticketId, String filename) {
        Path filePath = Paths.get(uploadDir, String.valueOf(ticketId), filename);
        try {
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }
    }

    public String getMimeType(Long ticketId, String filename) {
        Path filePath = Paths.get(uploadDir, String.valueOf(ticketId), filename);
        try {
            return Files.probeContentType(filePath);
        } catch (IOException e) {
            return "application/octet-stream";
        }
    }

    public void deleteAttachments(List<Attachment> attachments) {
        for (Attachment a : attachments) {
            Path file = Paths.get(uploadDir, String.valueOf(a.getTicket().getId()), a.getStoredName());
            try { Files.deleteIfExists(file); } catch (IOException ignored) {}
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "File too large: " + file.getOriginalFilename() + " (max 5MB)");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Invalid file type: " + file.getContentType() + ". Allowed: JPEG, PNG, WEBP");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.'));
    }
}