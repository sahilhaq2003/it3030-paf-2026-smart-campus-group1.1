package com.smartcampus.user.controller;

import com.smartcampus.user.dto.UpdateRoleDTO;
import com.smartcampus.user.dto.UserProfileDTO;
import com.smartcampus.user.model.Role;
import com.smartcampus.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserProfileDTO>> listUsers(
            @RequestParam(required = false) Role role) {
        return ResponseEntity.ok(userService.getAllUsers(role));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileDTO> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<UserProfileDTO> updateRole(
            @PathVariable Long id, @Valid @RequestBody UpdateRoleDTO body) {
        return ResponseEntity.ok(userService.updateUserRole(id, body.getRole()));
    }

    @PatchMapping("/{id}/enable")
    public ResponseEntity<UserProfileDTO> toggleEnabled(@PathVariable Long id) {
        return ResponseEntity.ok(userService.toggleUserStatus(id));
    }
}
