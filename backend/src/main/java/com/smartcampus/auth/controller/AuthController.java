package com.smartcampus.auth.controller;

import com.smartcampus.auth.dto.AuthResponseDTO;
import com.smartcampus.auth.dto.GoogleAuthRequest;
import com.smartcampus.auth.dto.LecturerOtpRequestDTO;
import com.smartcampus.auth.dto.LecturerRegisterRequestDTO;
import com.smartcampus.auth.dto.LoginRequestDTO;
import com.smartcampus.auth.dto.UpdateProfileDTO;
import com.smartcampus.auth.dto.UserResponseDTO;
import com.smartcampus.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/google")
    public AuthResponseDTO google(@Valid @RequestBody GoogleAuthRequest request) {
        return authService.signInWithGoogle(request.getIdToken());
    }

    @PostMapping("/login")
    public AuthResponseDTO login(@Valid @RequestBody LoginRequestDTO body) {
        return authService.signInWithPassword(body);
    }

    @PostMapping("/register/lecturer")
    public AuthResponseDTO registerLecturer(@Valid @RequestBody LecturerRegisterRequestDTO body) {
        return authService.registerLecturer(body);
    }

    @PostMapping("/register/lecturer/request-otp")
    public void requestLecturerOtp(@Valid @RequestBody LecturerOtpRequestDTO body) {
        authService.requestLecturerOtp(body);
    }

    @GetMapping("/me")
    public UserResponseDTO me() {
        return authService.getCurrentUserProfile();
    }

    @PatchMapping("/me")
    public UserResponseDTO updateMe(@Valid @RequestBody UpdateProfileDTO body) {
        return authService.updateCurrentUserProfile(body);
    }
}
