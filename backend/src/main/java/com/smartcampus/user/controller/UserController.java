package com.smartcampus.user.controller;

import com.smartcampus.auth.model.UserPrincipal;
import com.smartcampus.user.dto.CreateTechnicianDTO;
import com.smartcampus.user.dto.UpdateRoleDTO;
import com.smartcampus.user.dto.UpdateTechnicianDTO;
import com.smartcampus.user.dto.UserProfileDTO;
import com.smartcampus.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserProfileDTO>> listUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /** Declared before id routes so {@code /technicians} is never bound as {@code {id}}. */
    @GetMapping("/technicians")
    public ResponseEntity<List<UserProfileDTO>> listTechnicians() {
        return ResponseEntity.ok(userService.getTechnicians());
    }

    @PostMapping(value = "/technicians", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UserProfileDTO> createTechnician(@Valid @RequestBody CreateTechnicianDTO body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createTechnician(body));
    }

    @PatchMapping(value = "/technicians/{id:\\d+}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UserProfileDTO> updateTechnician(
            @PathVariable Long id, @Valid @RequestBody UpdateTechnicianDTO body) {
        return ResponseEntity.ok(userService.updateTechnician(id, body));
    }

    @DeleteMapping("/technicians/{id:\\d+}")
    public ResponseEntity<Void> deleteTechnician(@PathVariable Long id, Authentication auth) {
        Long actorId = ((UserPrincipal) auth.getPrincipal()).getId();
        userService.deleteTechnician(id, actorId);
        return ResponseEntity.noContent().build();
    }

    /** Path variable is digits only — does not match the segment {@code technicians}. */
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<UserProfileDTO> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PatchMapping("/{id:\\d+}/role")
    public ResponseEntity<UserProfileDTO> updateRole(
            @PathVariable Long id, @Valid @RequestBody UpdateRoleDTO body) {
        return ResponseEntity.ok(userService.updateUserRole(id, body.getRole()));
    }

    @PatchMapping("/{id:\\d+}/enable")
    public ResponseEntity<UserProfileDTO> toggleEnabled(@PathVariable Long id) {
        return ResponseEntity.ok(userService.toggleUserStatus(id));
    }
}
