package com.smartcampus.user.service;

import com.smartcampus.user.dto.UserProfileDTO;
import com.smartcampus.user.model.Role;
import com.smartcampus.user.model.User;
import com.smartcampus.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<UserProfileDTO> getAllUsers() {
        return userRepository.findAllWithRoles().stream().map(this::toProfileDto).toList();
    }

    @Transactional(readOnly = true)
    public UserProfileDTO getUserById(Long id) {
        User user =
                userRepository
                        .findByIdWithRoles(id)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return toProfileDto(user);
    }

    @Transactional
    public UserProfileDTO updateUserRole(Long id, Role role) {
        if (role == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "role is required");
        }
        User user =
                userRepository
                        .findByIdWithRoles(id)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setRoles(new HashSet<>(Set.of(role)));
        return toProfileDto(userRepository.save(user));
    }

    @Transactional
    public void toggleUserStatus(Long id) {
        User user =
                userRepository
                        .findById(id)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
    }

    private UserProfileDTO toProfileDto(User user) {
        Set<Role> rolesCopy =
                user.getRoles() == null || user.getRoles().isEmpty()
                        ? Set.of()
                        : Set.copyOf(user.getRoles());
        return UserProfileDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .avatarUrl(user.getAvatarUrl())
                .roles(rolesCopy)
                .enabled(user.isEnabled())
                .build();
    }
}
