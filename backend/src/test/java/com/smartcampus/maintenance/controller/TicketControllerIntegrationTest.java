package com.smartcampus.maintenance.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.auth.service.JwtService;
import com.smartcampus.maintenance.MaintenanceApplication;
import com.smartcampus.maintenance.dto.TicketRequestDTO;
import com.smartcampus.maintenance.dto.TicketStatusUpdateDTO;
import com.smartcampus.maintenance.model.Ticket;
import com.smartcampus.maintenance.model.enums.Priority;
import com.smartcampus.maintenance.model.enums.TicketCategory;
import com.smartcampus.maintenance.model.enums.TicketStatus;
import com.smartcampus.maintenance.repository.TicketRepository;
import com.smartcampus.notification.repository.NotificationRepository;
import com.smartcampus.user.model.Role;
import com.smartcampus.user.model.User;
import com.smartcampus.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = MaintenanceApplication.class)
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

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private JwtService jwtService;

    private User testUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        ticketRepository.deleteAll();
        userRepository.deleteAll();

        testUser =
                User.builder()
                        .email("user@test.com")
                        .name("Test User")
                        .roles(Set.of(Role.USER))
                        .build();
        testUser = userRepository.save(testUser);

        adminUser =
                User.builder()
                        .email("admin@test.com")
                        .name("Admin User")
                        .roles(Set.of(Role.ADMIN))
                        .build();
        adminUser = userRepository.save(adminUser);
    }

    private String bearer(User user) {
        return "Bearer " + jwtService.generateToken(user);
    }

    @Test
    void shouldCreateTicketWithValidData() throws Exception {
        TicketRequestDTO request =
                TicketRequestDTO.builder()
                        .title("AC Unit Repair")
                        .description("AC is not cooling properly in Lab 3")
                        .category(TicketCategory.ELECTRICAL)
                        .priority(Priority.HIGH)
                        .location("Building A, Lab 3")
                        .preferredContact("9876543210")
                        .build();

        MockMultipartFile ticketPart =
                new MockMultipartFile(
                        "ticket",
                        "ticket.json",
                        MediaType.APPLICATION_JSON_VALUE,
                        objectMapper.writeValueAsString(request).getBytes());

        mockMvc.perform(
                        multipart("/api/tickets")
                                .file(ticketPart)
                                .header(HttpHeaders.AUTHORIZATION, bearer(testUser)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("AC Unit Repair"))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    void shouldCreateTicketWithMultipartFileUpload() throws Exception {
        TicketRequestDTO request =
                TicketRequestDTO.builder()
                        .title("Broken Door")
                        .description("Main entrance door is broken")
                        .category(TicketCategory.OTHER)
                        .priority(Priority.MEDIUM)
                        .build();

        MockMultipartFile ticketPart =
                new MockMultipartFile(
                        "ticket",
                        "ticket.json",
                        MediaType.APPLICATION_JSON_VALUE,
                        objectMapper.writeValueAsString(request).getBytes());

        MockMultipartFile file1 =
                new MockMultipartFile(
                        "files",
                        "ticket-photo1.jpg",
                        "image/jpeg",
                        "fake image content".getBytes());

        MockMultipartFile file2 =
                new MockMultipartFile(
                        "files",
                        "ticket-photo2.jpg",
                        "image/jpeg",
                        "fake image content 2".getBytes());

        MvcResult result =
                mockMvc.perform(
                                multipart("/api/tickets")
                                        .file(ticketPart)
                                        .file(file1)
                                        .file(file2)
                                        .header(HttpHeaders.AUTHORIZATION, bearer(testUser)))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.attachments").isArray())
                        .andExpect(jsonPath("$.attachments", hasSize(2)))
                        .andReturn();

        String response = result.getResponse().getContentAsString();
        assertThat(response).contains("Broken Door");
    }

    @Test
    void shouldRejectMoreThan3FilesInUpload() throws Exception {
        TicketRequestDTO request =
                TicketRequestDTO.builder()
                        .title("Test")
                        .description("Test")
                        .category(TicketCategory.OTHER)
                        .priority(Priority.MEDIUM)
                        .build();

        MockMultipartFile ticketPart =
                new MockMultipartFile(
                        "ticket",
                        "ticket.json",
                        MediaType.APPLICATION_JSON_VALUE,
                        objectMapper.writeValueAsString(request).getBytes());

        MockMultipartFile[] files = new MockMultipartFile[4];
        for (int i = 0; i < 4; i++) {
            files[i] =
                    new MockMultipartFile(
                            "files",
                            "file" + i + ".jpg",
                            "image/jpeg",
                            "content".getBytes());
        }

        mockMvc.perform(
                        multipart("/api/tickets")
                                .file(ticketPart)
                                .file(files[0])
                                .file(files[1])
                                .file(files[2])
                                .file(files[3])
                                .header(HttpHeaders.AUTHORIZATION, bearer(testUser)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Maximum 3 attachments")));
    }

    @Test
    void shouldReturnTicketWithAttachments() throws Exception {
        Ticket ticket =
                Ticket.builder()
                        .title("Test Ticket")
                        .description("Test Description")
                        .category(TicketCategory.EQUIPMENT)
                        .priority(Priority.CRITICAL)
                        .location("Lab 1")
                        .status(TicketStatus.OPEN)
                        .reportedBy(testUser)
                        .build();
        ticket = ticketRepository.save(ticket);

        mockMvc.perform(
                        get("/api/tickets/" + ticket.getId())
                                .header(HttpHeaders.AUTHORIZATION, bearer(testUser))
                                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(ticket.getId()))
                .andExpect(jsonPath("$.title").value("Test Ticket"))
                .andExpect(jsonPath("$.attachments").isArray());
    }

    @Test
    void shouldValidateInvalidStatusTransition() throws Exception {
        Ticket ticket =
                Ticket.builder()
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
        invalid.setStatus(TicketStatus.RESOLVED);
        invalid.setResolutionNotes("Quick fix");

        // Admin bypasses per-technician assignment rules; transition validation still applies.
        mockMvc.perform(
                        patch("/api/tickets/" + ticket.getId() + "/status")
                                .header(HttpHeaders.AUTHORIZATION, bearer(adminUser))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Invalid status transition")));
    }

    @Test
    void shouldAllowValidStatusTransition() throws Exception {
        Ticket ticket =
                Ticket.builder()
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

        mockMvc.perform(
                        patch("/api/tickets/" + ticket.getId() + "/status")
                                .header(HttpHeaders.AUTHORIZATION, bearer(adminUser))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(valid)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        Optional<Ticket> updated = ticketRepository.findById(ticket.getId());
        assertThat(updated).isPresent();
        assertThat(updated.get().getStatus()).isEqualTo(TicketStatus.IN_PROGRESS);
    }

    @Test
    void shouldRequireResolutionNotesWhenMarkedResolved() throws Exception {
        Ticket ticket =
                Ticket.builder()
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
        noNotes.setResolutionNotes("");

        mockMvc.perform(
                        patch("/api/tickets/" + ticket.getId() + "/status")
                                .header(HttpHeaders.AUTHORIZATION, bearer(adminUser))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(noNotes)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Resolution notes")));
    }

    @Test
    void shouldReturnNotFoundForDeletedTicket() throws Exception {
        mockMvc.perform(
                        get("/api/tickets/999")
                                .header(HttpHeaders.AUTHORIZATION, bearer(testUser))
                                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldListMyTicketsFilteredByUser() throws Exception {
        Ticket ticket1 =
                Ticket.builder()
                        .title("My Ticket")
                        .description("Test")
                        .category(TicketCategory.IT)
                        .priority(Priority.MEDIUM)
                        .location("Lab 1")
                        .status(TicketStatus.OPEN)
                        .reportedBy(testUser)
                        .build();
        ticketRepository.save(ticket1);

        Ticket ticket2 =
                Ticket.builder()
                        .title("Admin Ticket")
                        .description("Test")
                        .category(TicketCategory.IT)
                        .priority(Priority.MEDIUM)
                        .location("Lab 2")
                        .status(TicketStatus.OPEN)
                        .reportedBy(adminUser)
                        .build();
        ticketRepository.save(ticket2);

        mockMvc.perform(
                        get("/api/tickets/my")
                                .header(HttpHeaders.AUTHORIZATION, bearer(testUser))
                                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("My Ticket"));
    }

    @Test
    void shouldAllowAdminsToDeleteTickets() throws Exception {
        Ticket ticket =
                Ticket.builder()
                        .title("Deletable Ticket")
                        .description("Test")
                        .category(TicketCategory.EQUIPMENT)
                        .priority(Priority.LOW)
                        .location("Lab 1")
                        .status(TicketStatus.OPEN)
                        .reportedBy(testUser)
                        .build();
        ticket = ticketRepository.save(ticket);

        mockMvc.perform(
                        delete("/api/tickets/" + ticket.getId())
                                .header(HttpHeaders.AUTHORIZATION, bearer(adminUser)))
                .andExpect(status().isNoContent());

        Optional<Ticket> deleted = ticketRepository.findById(ticket.getId());
        assertThat(deleted).isEmpty();
    }
}
