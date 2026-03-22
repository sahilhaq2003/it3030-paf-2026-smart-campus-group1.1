package com.smartcampus.auth.controller;

import com.smartcampus.auth.dto.AuthResponseDTO;
import com.smartcampus.auth.dto.GoogleAuthRequest;
import com.smartcampus.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
}
