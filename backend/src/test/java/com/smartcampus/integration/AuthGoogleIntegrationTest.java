package com.smartcampus.integration;

import com.smartcampus.maintenance.MaintenanceApplication;
import com.smartcampus.auth.dto.GoogleUserClaims;
import com.smartcampus.auth.service.GoogleOAuthTokenVerifier;
import com.smartcampus.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** OAuth step with a mocked Google token verifier (no real Google call). */
@SpringBootTest(classes = MaintenanceApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthGoogleIntegrationTest {

    @MockBean GoogleOAuthTokenVerifier googleOAuthTokenVerifier;

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;

    @BeforeEach
    void cleanUsers() {
        userRepository.deleteAll();
    }

    @Test
    void postGoogle_whenVerifierReturnsClaims_returnsJwtAndUser() throws Exception {
        when(googleOAuthTokenVerifier.isEnabled()).thenReturn(true);
        when(googleOAuthTokenVerifier.verify(anyString()))
                .thenReturn(
                        Optional.of(
                                new GoogleUserClaims(
                                        "integration-oauth@test.local", "Integration OAuth", null)));

        mockMvc.perform(
                        post("/api/auth/google")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"idToken\":\"fake.google.jwt\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.email").value("integration-oauth@test.local"));
    }
}
