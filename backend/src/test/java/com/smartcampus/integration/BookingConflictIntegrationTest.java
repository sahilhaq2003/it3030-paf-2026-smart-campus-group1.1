package com.smartcampus.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.auth.service.JwtService;
import com.smartcampus.facilities.booking.dto.BookingRequestDTO;
import com.smartcampus.facilities.booking.repository.BookingRepository;
import com.smartcampus.facilities.model.Facility;
import com.smartcampus.facilities.model.ResourceType;
import com.smartcampus.facilities.model.Status;
import com.smartcampus.facilities.repository.FacilityRepository;
import com.smartcampus.maintenance.MaintenanceApplication;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Set;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = MaintenanceApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BookingConflictIntegrationTest {

    @Autowired private MockMvc mockMvc;

    @Autowired private ObjectMapper objectMapper;

    @Autowired private JwtService jwtService;

    @Autowired private UserRepository userRepository;

    @Autowired private FacilityRepository facilityRepository;

    @Autowired private BookingRepository bookingRepository;

    @Autowired private NotificationRepository notificationRepository;

    private User user;
    private Facility facility;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        bookingRepository.deleteAll();
        facilityRepository.deleteAll();
        userRepository.deleteAll();

        user =
                userRepository.save(
                        User.builder()
                                .email("booking-user@test.local")
                                .name("Booking User")
                                .roles(Set.of(Role.USER))
                                .build());

        facility =
                facilityRepository.save(
                        Facility.builder()
                                .name("Lab 101")
                                .resourceType(ResourceType.LAB)
                                .capacity(10)
                                .location("Block A")
                                .description("Test facility")
                                .availabilityStart(LocalTime.of(9, 0))
                                .availabilityEnd(LocalTime.of(17, 0))
                                .status(Status.ACTIVE)
                                .build());
    }

    @Test
    void overlappingBooking_secondRejected_andNotificationsGenerated() throws Exception {
        String token = jwtService.generateToken(user);

        LocalDateTime tomorrow = LocalDateTime.now().plusDays(1).withSecond(0).withNano(0);
        var firstStart = tomorrow.withHour(10);
        var firstEnd = tomorrow.withHour(11);
        var secondStart = tomorrow.withHour(10).plusMinutes(30);
        var secondEnd = tomorrow.withHour(11).plusMinutes(30);

        BookingRequestDTO first = new BookingRequestDTO(facility.getId(), firstStart, firstEnd);
        BookingRequestDTO second =
                new BookingRequestDTO(facility.getId(), secondStart, secondEnd);

        mockMvc.perform(
                        post("/api/bookings")
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated());

        mockMvc.perform(
                        post("/api/bookings")
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(second)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("already booked")));

        mockMvc.perform(
                        get("/api/notifications")
                                .param("page", "0")
                                .param("size", "10")
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath(
                                "$.content[*].type",
                                containsInAnyOrder("BOOKING_APPROVED", "BOOKING_REJECTED")));
    }
}

