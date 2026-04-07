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
        // Validate total number of files
        if (files.size() > MAX_FILES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Maximum " + MAX_FILES + " attachments are allowed per ticket. You attempted to upload " + files.size());
        }

        List<Attachment> saved = new ArrayList<>();

        for (MultipartFile file : files) {
            // Validate each individual file before processing
            validateFile(file);
            saved.add(saveAttachment(file, ticket));
        }

        return saved;
    }

    public Attachment saveAttachment(MultipartFile file, Ticket ticket) {
        // Validate file before processing
        validateFile(file);

        // Generate a unique filename using UUID to avoid collisions
        String storedName = UUID.randomUUID() + getExtension(file.getOriginalFilename());
        String fileUrl = null;

        try {
            // Try to upload to Supabase Storage
            fileUrl = supabaseStorageService.uploadFile(file, storedName);
            log.info("File uploaded to Supabase: {} -> {}", file.getOriginalFilename(), fileUrl);
        } catch (IOException e) {
            // If upload fails, log warning but still save the attachment record
            // This allows users to have attachment metadata even if cloud upload fails
            log.warn("Failed to upload file to Supabase: {} - {}", file.getOriginalFilename(), e.getMessage());
            fileUrl = null; // Allow null fileUrl for now (can be retried later)
        }

        // Build and persist the attachment record
        var attachment = Attachment.builder()
            .ticket(ticket)
            .originalName(file.getOriginalFilename())
            .storedName(storedName)
            .mimeType(file.getContentType())
            .size(file.getSize())
            .fileUrl(fileUrl)  // Can be null if upload failed
            .build();

        return attachmentRepo.save(attachment);
    }

    /**
     * Stream attachment bytes for users who may view the ticket (reporter or ticket staff).
     * Validates access permissions before returning the file content.
     */
    public AttachmentContent loadForDownload(
            long ticketId, String storedName, long currentUserId, boolean ticketStaff) {
        // Fetch the ticket to verify access permissions
        var ticket = ticketRepo
                .findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Ticket not found. Cannot access attachments for non-existent ticket."));
        
        // Check if user has permission to view this ticket
        if (!ticketStaff && !ticket.getReportedBy().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                "You do not have permission to download attachments from this ticket");
        }
        
        // Find the specific attachment
        var att = attachmentRepo
                .findByTicket_IdAndStoredName(ticketId, storedName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Attachment not found for this ticket."));
        
        try {
            // Download file content from cloud storage
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
        // Delete all attachment files from Supabase Storage
        // This is called when a ticket is deleted
        for (Attachment a : attachments) {
            supabaseStorageService.deleteFile(a.getStoredName());
        }
    }

    public void validateFile(MultipartFile file) {
        // Check file size doesn't exceed maximum
        if (file.getSize() > MAX_FILE_SIZE) {
            long maxMB = MAX_FILE_SIZE / (1024 * 1024);
            long fileSizeMB = file.getSize() / (1024 * 1024);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "File size exceeds limit: '" + file.getOriginalFilename() + "' is " + fileSizeMB + 
                "MB but maximum allowed is " + maxMB + "MB");
        }
        
        // Check file type is in allowed list (images only: JPEG, PNG, WEBP)
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "File type not allowed: '" + file.getContentType() + "'. Only JPEG, PNG, and WEBP images are accepted.");
        }
    }

    public void validateFileCount(List<MultipartFile> files, Ticket ticket) {
        if (files.size() > MAX_FILES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Maximum " + MAX_FILES + " attachments allowed");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.'));
    }
}