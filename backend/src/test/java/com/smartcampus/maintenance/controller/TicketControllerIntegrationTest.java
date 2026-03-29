package com.smartcampus.maintenance.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.auth.model.UserPrincipal;
import com.smartcampus.maintenance.dto.TicketRequestDTO;
import com.smartcampus.maintenance.dto.TicketStatusUpdateDTO;
import com.smartcampus.maintenance.model.Ticket;
import com.smartcampus.maintenance.model.enums.Priority;
import com.smartcampus.maintenance.model.enums.TicketCategory;
import com.smartcampus.maintenance.model.enums.TicketStatus;
import com.smartcampus.maintenance.repository.TicketRepository;
import com.smartcampus.user.model.User;
import com.smartcampus.user.model.Role;
import com.smartcampus.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;

import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TicketControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private User adminUser;
    private String userToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        // Clean up
        ticketRepository.deleteAll();
        userRepository.deleteAll();

        // Create test users
        testUser = User.builder()
            .email("user@test.com")
            .name("Test User")
            .roles(Set.of(Role.USER))
            .build();
        testUser = userRepository.save(testUser);

        adminUser = User.builder()
            .email("admin@test.com")
            .name("Admin User")
            .roles(Set.of(Role.ADMIN))
            .build();
        adminUser = userRepository.save(adminUser);

        // In real scenario, generate proper JWT tokens
        // For this test, we'll use basic auth or mock authentication
        userToken = "Bearer user_token";
        adminToken = "Bearer admin_token";
    }

    private void authenticateAs(User user, String... roleNames) {
        var authorities = java.util.Arrays.stream(roleNames)
            .map(r -> new SimpleGrantedAuthority(r.startsWith("ROLE_") ? r : "ROLE_" + r))
            .collect(java.util.stream.Collectors.toList());
        
        UserPrincipal principal = new UserPrincipal(
            user.getId(),
            user.getEmail(),
            "",
            authorities
        );
        
        var auth = new UsernamePasswordAuthenticationToken(
            principal,
            null,
            authorities
        );
        
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void shouldCreateTicketWithValidData() throws Exception {
        authenticateAs(testUser, "ROLE_USER");
        // Arrange
        TicketRequestDTO request = TicketRequestDTO.builder()
            .title("AC Unit Repair")
            .description("AC is not cooling properly in Lab 3")
            .category(TicketCategory.ELECTRICAL)
            .priority(Priority.HIGH)
            .location("Building A, Lab 3")
            .preferredContact("9876543210")
            .build();

        MockMultipartFile ticketPart = new MockMultipartFile(
            "ticket",
            "ticket.json",
            MediaType.APPLICATION_JSON_VALUE,
            objectMapper.writeValueAsString(request).getBytes()
        );

        // Act & Assert
        mockMvc.perform(multipart("/api/tickets")
            .file(ticketPart))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.title").value("AC Unit Repair"))
            .andExpect(jsonPath("$.status").value("OPEN"))
            .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    void shouldCreateTicketWithMultipartFileUpload() throws Exception {
        authenticateAs(testUser, "ROLE_USER");
        // Arrange
        TicketRequestDTO request = TicketRequestDTO.builder()
            .title("Broken Door")
            .description("Main entrance door is broken")
            .category(TicketCategory.OTHER)
            .priority(Priority.MEDIUM)
            .build();

        MockMultipartFile ticketPart = new MockMultipartFile(
            "ticket",
            "ticket.json",
            MediaType.APPLICATION_JSON_VALUE,
            objectMapper.writeValueAsString(request).getBytes()
        );

        MockMultipartFile file1 = new MockMultipartFile(
            "files",
            "ticket-photo1.jpg",
            "image/jpeg",
            "fake image content".getBytes()
        );

        MockMultipartFile file2 = new MockMultipartFile(
            "files",
            "ticket-photo2.jpg",
            "image/jpeg",
            "fake image content 2".getBytes()
        );

        // Act & Assert
        MvcResult result = mockMvc.perform(multipart("/api/tickets")
            .file(ticketPart)
            .file(file1)
            .file(file2))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.attachments").isArray())
            .andExpect(jsonPath("$.attachments", hasSize(2)))
            .andReturn();

        String response = result.getResponse().getContentAsString();
        assertThat(response).contains("Broken Door");
    }

    @Test
    void shouldRejectMoreThan3FilesInUpload() throws Exception {
        authenticateAs(testUser, "ROLE_USER");
        // Arrange - 4 files (exceeds limit)
        TicketRequestDTO request = TicketRequestDTO.builder()
            .title("Test")
            .description("Test")
            .category(TicketCategory.OTHER)
            .priority(Priority.MEDIUM)
            .build();

        MockMultipartFile ticketPart = new MockMultipartFile(
            "ticket",
            "ticket.json",
            MediaType.APPLICATION_JSON_VALUE,
            objectMapper.writeValueAsString(request).getBytes()
        );

        MockMultipartFile[] files = new MockMultipartFile[4];
        for (int i = 0; i < 4; i++) {
            files[i] = new MockMultipartFile(
                "files",
                "file" + i + ".jpg",
                "image/jpeg",
                "content".getBytes()
            );
        }

        // Act & Assert
        mockMvc.perform(multipart("/api/tickets")
            .file(ticketPart)
            .file(files[0])
            .file(files[1])
            .file(files[2])
            .file(files[3]))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("maximum 3 files")));
    }

    @Test
    void shouldReturnTicketWithAttachments() throws Exception {
        authenticateAs(testUser, "ROLE_USER");
        // Arrange - Create ticket with attachment
        Ticket ticket = Ticket.builder()
            .title("Test Ticket")
            .description("Test Description")
            .category(TicketCategory.EQUIPMENT)
            .priority(Priority.CRITICAL)
            .location("Lab 1")
            .status(TicketStatus.OPEN)
            .reportedBy(testUser)
            .build();
        ticket = ticketRepository.save(ticket);

        // Act & Assert
        mockMvc.perform(get("/api/tickets/" + ticket.getId())
            .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(ticket.getId()))
            .andExpect(jsonPath("$.title").value("Test Ticket"))
            .andExpect(jsonPath("$.attachments").isArray());
    }

    @Test
    void shouldValidateInvalidStatusTransition() throws Exception {
        authenticateAs(testUser, "ROLE_USER", "ROLE_TECHNICIAN");
        // Arrange - Create ticket
        Ticket ticket = Ticket.builder()
            .title("Test Ticket")
            .description("Test")
            .category(TicketCategory.IT)
            .priority(Priority.HIGH)
            .location("Lab 1")
            .status(TicketStatus.OPEN)
            .reportedBy(testUser)
            .build();
        ticket = ticketRepository.save(ticket);

        TicketStatusUpdateDTO invalid = new TicketStatusUpdateDTO();
        invalid.setStatus(TicketStatus.RESOLVED); // Skip IN_PROGRESS
        invalid.setResolutionNotes("Quick fix");

        // Act & Assert
        mockMvc.perform(patch("/api/tickets/" + ticket.getId() + "/status")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(invalid)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("Invalid status transition")));
    }

    @Test
    void shouldAllowValidStatusTransition() throws Exception {
        authenticateAs(testUser, "ROLE_ADMIN");
        // Arrange
        Ticket ticket = Ticket.builder()
            .title("Test")
            .description("Test")
            .category(TicketCategory.CLEANING)
            .priority(Priority.MEDIUM)
            .location("Lab 1")
            .status(TicketStatus.OPEN)
            .reportedBy(testUser)
            .build();
        ticket = ticketRepository.save(ticket);

        TicketStatusUpdateDTO valid = new TicketStatusUpdateDTO();
        valid.setStatus(TicketStatus.IN_PROGRESS);

        // Act & Assert
        mockMvc.perform(patch("/api/tickets/" + ticket.getId() + "/status")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(valid)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        // Verify in database
        Optional<Ticket> updated = ticketRepository.findById(ticket.getId());
        assertThat(updated).isPresent();
        assertThat(updated.get().getStatus()).isEqualTo(TicketStatus.IN_PROGRESS);
    }

    @Test
    void shouldRequireResolutionNotesWhenMarkedResolved() throws Exception {
        authenticateAs(testUser, "ROLE_ADMIN");
        // Arrange
        Ticket ticket = Ticket.builder()
            .title("Test")
            .description("Test")
            .category(TicketCategory.PLUMBING)
            .priority(Priority.HIGH)
            .location("Lab 1")
            .status(TicketStatus.IN_PROGRESS)
            .reportedBy(testUser)
            .build();
        ticket = ticketRepository.save(ticket);

        TicketStatusUpdateDTO noNotes = new TicketStatusUpdateDTO();
        noNotes.setStatus(TicketStatus.RESOLVED);
        noNotes.setResolutionNotes(""); // Empty

        // Act & Assert
        mockMvc.perform(patch("/api/tickets/" + ticket.getId() + "/status")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(noNotes)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("Resolution notes")));
    }

    @Test
    void shouldReturnNotFoundForDeletedTicket() throws Exception {
        authenticateAs(testUser, "ROLE_USER", "ROLE_TECHNICIAN");
        // Act & Assert
        mockMvc.perform(get("/api/tickets/999")
            .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }

    @Test
    void shouldListMyTicketsFilteredByUser() throws Exception {
        authenticateAs(testUser, "ROLE_USER");
        // Arrange - Create tickets for different users
        Ticket ticket1 = Ticket.builder()
            .title("My Ticket")
            .description("Test")
            .category(TicketCategory.IT)
            .priority(Priority.MEDIUM)
            .location("Lab 1")
            .status(TicketStatus.OPEN)
            .reportedBy(testUser)
            .build();
        ticketRepository.save(ticket1);

        Ticket ticket2 = Ticket.builder()
            .title("Admin Ticket")
            .description("Test")
            .category(TicketCategory.IT)
            .priority(Priority.MEDIUM)
            .location("Lab 2")
            .status(TicketStatus.OPEN)
            .reportedBy(adminUser)
            .build();
        ticketRepository.save(ticket2);

        // Act & Assert - Should only return tickets for current user
        mockMvc.perform(get("/api/tickets/my")
            .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].title").value("My Ticket"));
    }

    @Test
    void shouldAllowAdminsToDeleteTickets() throws Exception {
        authenticateAs(adminUser, "ROLE_ADMIN");
        // Arrange
        Ticket ticket = Ticket.builder()
            .title("Deletable Ticket")
            .description("Test")
            .category(TicketCategory.EQUIPMENT)
            .priority(Priority.LOW)
            .location("Lab 1")
            .status(TicketStatus.OPEN)
            .reportedBy(testUser)
            .build();
        ticket = ticketRepository.save(ticket);

        // Act & Assert
        mockMvc.perform(delete("/api/tickets/" + ticket.getId()))
            .andExpect(status().isNoContent());

        // Verify deletion
        Optional<Ticket> deleted = ticketRepository.findById(ticket.getId());
        assertThat(deleted).isEmpty();
    }
}
