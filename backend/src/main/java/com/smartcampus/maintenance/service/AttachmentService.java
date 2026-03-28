package com.smartcampus.maintenance.service;

import com.smartcampus.maintenance.model.Attachment;
import com.smartcampus.maintenance.model.Ticket;
import com.smartcampus.maintenance.repository.AttachmentRepository;
import com.smartcampus.maintenance.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttachmentService {

    private final AttachmentRepository attachmentRepo;
    private final TicketRepository ticketRepo;
    private final SupabaseStorageService supabaseStorageService;

    public record AttachmentContent(byte[] body, String contentType) {}

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
            String fileUrl = null;

            try {
                // Try to upload to Supabase Storage
                fileUrl = supabaseStorageService.uploadFile(file, storedName);
                log.info("File uploaded to Supabase: {} -> {}", file.getOriginalFilename(), fileUrl);
            } catch (IOException e) {
                // If upload fails, log it but still save the attachment record
                log.warn("Failed to upload file to Supabase: {} - {}", file.getOriginalFilename(), e.getMessage());
                fileUrl = null; // Allow null fileUrl for now
            }

            var attachment = Attachment.builder()
                .ticket(ticket)
                .originalName(file.getOriginalFilename())
                .storedName(storedName)
                .mimeType(file.getContentType())
                .size(file.getSize())
                .fileUrl(fileUrl)  // Can be null if upload failed
                .build();

            saved.add(attachmentRepo.save(attachment));
        }

        return saved;
    }

    /**
     * Stream attachment bytes for users who may view the ticket (reporter or ticket staff).
     */
    public AttachmentContent loadForDownload(
            long ticketId, String storedName, long currentUserId, boolean ticketStaff) {
        var ticket = ticketRepo
                .findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        if (!ticketStaff && !ticket.getReportedBy().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        var att = attachmentRepo
                .findByTicket_IdAndStoredName(ticketId, storedName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));
        try {
            byte[] bytes = supabaseStorageService.downloadObject(storedName);
            String ct = att.getMimeType() != null && !att.getMimeType().isBlank()
                    ? att.getMimeType()
                    : MediaType.APPLICATION_OCTET_STREAM_VALUE;
            return new AttachmentContent(bytes, ct);
        } catch (IOException e) {
            log.error("Attachment download failed ticket={} file={}", ticketId, storedName, e);
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Could not load attachment from storage");
        }
    }

    public void deleteAttachments(List<Attachment> attachments) {
        for (Attachment a : attachments) {
            // Delete from Supabase Storage
            supabaseStorageService.deleteFile(a.getStoredName());
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