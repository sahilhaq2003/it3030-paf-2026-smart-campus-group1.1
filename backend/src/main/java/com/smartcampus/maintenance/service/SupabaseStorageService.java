package com.smartcampus.maintenance.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupabaseStorageService {

    private final RestTemplate restTemplate;

    @Value("${supabase.url:}")
    private String supabaseUrl;

    @Value("${supabase.service-key:}")
    private String serviceKey;

    @Value("${supabase.bucket:ticket-attachments}")
    private String bucket;

    @PostConstruct
    private void init() {
        // Try to load from environment variables if not set via properties
        if (supabaseUrl == null || supabaseUrl.isBlank()) {
            supabaseUrl = System.getenv("SUPABASE_URL");
        }
        if (serviceKey == null || serviceKey.isBlank()) {
            serviceKey = System.getenv("SUPABASE_SERVICE_KEY");
        }
        
        log.info("Supabase Storage initialized - URL: {}, Bucket: {}", 
            supabaseUrl != null ? "configured" : "NOT CONFIGURED", bucket);
    }

    /**
     * Upload file to Supabase Storage
     * @param file MultipartFile to upload
     * @param storedName UUID filename
     * @return Public URL of uploaded file
     */
    public String uploadFile(MultipartFile file, String storedName) throws IOException {
        validateConfig();
        
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/tickets/" + storedName;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + serviceKey);
        headers.set("Content-Type", file.getContentType());
        headers.set("x-upsert", "true");

        HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);
        
        try {
            ResponseEntity<String> response = restTemplate.exchange(uploadUrl, HttpMethod.POST, entity, String.class);
            log.info("File uploaded to Supabase: {}", storedName);
        } catch (Exception e) {
            log.error("Failed to upload file to Supabase: {}", storedName, e);
            throw new IOException("Failed to upload file to Supabase", e);
        }

        // Return the public URL
        return supabaseUrl + "/storage/v1/object/public/" + bucket + "/tickets/" + storedName;
    }

    /**
     * Download object bytes (service role). Path matches {@link #uploadFile}.
     */
    public byte[] downloadObject(String storedName) throws IOException {
        validateConfig();
        String getUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/tickets/" + storedName;
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(serviceKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<byte[]> response =
                    restTemplate.exchange(getUrl, HttpMethod.GET, entity, byte[].class);
            if (response.getBody() == null || response.getBody().length == 0) {
                throw new IOException("Empty body from Supabase for " + storedName);
            }
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to download from Supabase: {}", storedName, e);
            throw new IOException("Failed to download file from Supabase", e);
        }
    }

    /**
     * Delete file from Supabase Storage
     * @param storedName UUID filename to delete
     */
    public void deleteFile(String storedName) {
        try {
            validateConfig();
        } catch (IOException e) {
            log.warn("Cannot delete file - Supabase not configured: {}", e.getMessage());
            return;
        }
        
        String deleteUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/tickets/" + storedName;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + serviceKey);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            restTemplate.exchange(deleteUrl, HttpMethod.DELETE, entity, String.class);
            log.info("File deleted from Supabase: {}", storedName);
        } catch (Exception e) {
            log.error("Failed to delete file from Supabase: {}", storedName, e);
            // Don't throw - deletion errors shouldn't break the flow
        }
    }

    private void validateConfig() throws IOException {
        if (supabaseUrl == null || supabaseUrl.isBlank() || 
            serviceKey == null || serviceKey.isBlank()) {
            throw new IOException("Supabase credentials not configured. " +
                "Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.");
        }
    }
}
