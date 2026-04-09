package com.smartcampus.maintenance.service;

import com.smartcampus.maintenance.dto.AttachmentDTO;
import com.smartcampus.maintenance.model.Attachment;
import com.smartcampus.maintenance.model.Ticket;
import com.smartcampus.maintenance.repository.AttachmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttachmentServiceTest {

    @Mock
    private AttachmentRepository attachmentRepository;

    @Mock
    private SupabaseStorageService supabaseStorageService;

    @InjectMocks
    private AttachmentService attachmentService;

    private Ticket testTicket;

    @BeforeEach
    void setUp() {
        testTicket = new Ticket();
        testTicket.setId(1L);
        testTicket.setTitle("Test Ticket");
    }

    @Test
    void shouldAcceptValidImageFile() throws IOException {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "ticket.jpg",
                "image/jpeg",
                "image content".getBytes());

        // Act & Assert
        assertThatCode(() -> attachmentService.validateFile(file))
                .doesNotThrowAnyException();
    }

    @Test
    void shouldRejectNonImageMimeType() throws IOException {
        // Arrange - PDF file instead of image
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "document.pdf",
                "application/pdf",
                "pdf content".getBytes());

        // Act & Assert
        assertThatThrownBy(() -> attachmentService.validateFile(file))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Invalid file type");
    }

    @Test
    void shouldRejectFileSizeExceeding5MB() throws IOException {
        // Arrange - 6MB file (exceeds 5MB limit)
        byte[] largeContent = new byte[6 * 1024 * 1024 + 1];
        Arrays.fill(largeContent, (byte) 1);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "large.jpg",
                "image/jpeg",
                largeContent);

        // Act & Assert
        assertThatThrownBy(() -> attachmentService.validateFile(file))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("max 5MB");
    }

    @Test
    void shouldAcceptMaximum3FilesPerTicket() throws IOException {
        // Arrange
        List<MultipartFile> files = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            files.add(new MockMultipartFile(
                    "file" + i,
                    "image" + i + ".jpg",
                    "image/jpeg",
                    "content".getBytes()));
        }

        // Act & Assert
        assertThatCode(() -> attachmentService.validateFileCount(files, testTicket))
                .doesNotThrowAnyException();
    }

    @Test
    void shouldRejectMoreThan3FilesPerTicket() throws IOException {
        // Arrange - 4 files (exceeds 3 limit)
        List<MultipartFile> files = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            files.add(new MockMultipartFile(
                    "file" + i,
                    "image" + i + ".jpg",
                    "image/jpeg",
                    "content".getBytes()));
        }

        // Act & Assert
        assertThatThrownBy(() -> attachmentService.validateFileCount(files, testTicket))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Maximum 3 attachments allowed");
    }

    @Test
    void shouldRejectImageTypeWebP() throws IOException {
        // Arrange - WebP is allowed
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "image.webp",
                "image/webp",
                "webp content".getBytes());

        // Act & Assert - Should NOT throw
        assertThatCode(() -> attachmentService.validateFile(file))
                .doesNotThrowAnyException();
    }

    @Test
    void shouldRejectImageTypePNG() throws IOException {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "image.png",
                "image/png",
                "png content".getBytes());

        // Act & Assert
        assertThatCode(() -> attachmentService.validateFile(file))
                .doesNotThrowAnyException();
    }

    @Test
    void shouldGenerateUUIDForStoredFileName() throws IOException {
        // Arrange
        MultipartFile file = new MockMultipartFile(
                "file",
                "original-name.jpg",
                "image/jpeg",
                "content".getBytes());

        when(supabaseStorageService.uploadFile(any(), any())).thenReturn("https://url.com/file");
        when(attachmentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Attachment result = attachmentService.saveAttachment(file, testTicket);

        // Assert
        assertThat(result.getStoredName())
                .isNotBlank()
                .doesNotContain("original-name")
                .matches("[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\\.jpg"); // UUID format
    }

    @Test
    void shouldPreserveOriginalFileNameInMetadata() throws IOException {
        // Arrange
        MultipartFile file = new MockMultipartFile(
                "file",
                "user-screenshot.jpg",
                "image/jpeg",
                "content".getBytes());

        when(supabaseStorageService.uploadFile(any(), any())).thenReturn("https://url.com/file");
        when(attachmentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Attachment result = attachmentService.saveAttachment(file, testTicket);

        // Assert
        assertThat(result.getOriginalName()).isEqualTo("user-screenshot.jpg");
    }

    @Test
    void shouldValidateMimeTypeOfSavedAttachment() throws IOException {
        // Arrange
        MultipartFile file = new MockMultipartFile(
                "file",
                "image.jpg",
                "image/jpeg",
                "content".getBytes());

        when(supabaseStorageService.uploadFile(any(), any())).thenReturn("https://url.com/file");
        when(attachmentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Attachment result = attachmentService.saveAttachment(file, testTicket);

        // Assert
        assertThat(result.getMimeType()).isEqualTo("image/jpeg");
    }

    @Test
    void shouldSaveFileSizeInBytes() throws IOException {
        // Arrange
        byte[] content = "test content with 24 bytes".getBytes(); // exactly 24 bytes
        MultipartFile file = new MockMultipartFile(
                "file",
                "image.jpg",
                "image/jpeg",
                content);

        when(supabaseStorageService.uploadFile(any(), any())).thenReturn("https://url.com/file");
        when(attachmentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Attachment result = attachmentService.saveAttachment(file, testTicket);

        // Assert
        assertThat(result.getSize()).isEqualTo(content.length);
    }

    @Test
    void shouldAssociateAttachmentWithTicket() throws IOException {
        // Arrange
        MultipartFile file = new MockMultipartFile(
                "file",
                "image.jpg",
                "image/jpeg",
                "content".getBytes());

        when(supabaseStorageService.uploadFile(any(), any())).thenReturn("https://url.com/file");
        when(attachmentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Attachment result = attachmentService.saveAttachment(file, testTicket);

        // Assert
        assertThat(result.getTicket()).isEqualTo(testTicket);
    }
}
