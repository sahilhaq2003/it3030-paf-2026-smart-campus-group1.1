package com.smartcampus.user.service;

import com.smartcampus.maintenance.repository.CommentRepository;
import com.smartcampus.maintenance.repository.TicketRepository;
import com.smartcampus.user.dto.CreateTechnicianDTO;
import com.smartcampus.user.dto.UpdateTechnicianDTO;
import com.smartcampus.user.dto.UserProfileDTO;
import com.smartcampus.user.model.Role;
import com.smartcampus.user.model.User;
import com.smartcampus.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;

    @Transactional(readOnly = true)
    public List<UserProfileDTO> getAllUsers() {
        return userRepository.findAllWithRoles().stream().map(this::toProfileDto).toList();
    }

    /** Users with TECHNICIAN role (for assignment UIs). */
    @Transactional(readOnly = true)
    public List<UserProfileDTO> getTechnicians() {
        return userRepository.findAllWithRoles().stream()
                .filter(u -> u.getRoles() != null && u.getRoles().contains(Role.TECHNICIAN))
                .sorted(Comparator.comparing(User::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toProfileDto)
                .toList();
    }

    @Transactional
    public UserProfileDTO createTechnician(CreateTechnicianDTO dto) {
        String email = dto.getEmail().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This email is already registered");
        }
        Set<Role> roles = new HashSet<>();
        roles.add(Role.TECHNICIAN);
        roles.add(Role.USER);
        User user =
                User.builder()
                        .email(email)
                        .name(dto.getName().trim())
                        .passwordHash(passwordEncoder.encode(dto.getPassword()))
                        .provider(User.AuthProvider.LOCAL)
                        .roles(roles)
                        .enabled(true)
                        .build();
        return toProfileDto(userRepository.save(user));
    }

    @Transactional
    public UserProfileDTO updateTechnician(Long id, UpdateTechnicianDTO dto) {
        User user =
                userRepository
                        .findByIdWithRoles(id)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        assertTechnicianAccount(user);

        boolean hasName = StringUtils.hasText(dto.getName());
        boolean hasEmail = StringUtils.hasText(dto.getEmail());
        boolean hasPassword = StringUtils.hasText(dto.getPassword());
        if (!hasName && !hasEmail && !hasPassword) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide at least one field to update");
        }

        if (hasName) {
            user.setName(dto.getName().trim());
        }
        if (hasEmail) {
            String newEmail = dto.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(user.getEmail())) {
                userRepository
                        .findByEmail(newEmail)
                        .ifPresent(
                                other -> {
                                    if (!other.getId().equals(user.getId())) {
                                        throw new ResponseStatusException(
                                                HttpStatus.CONFLICT, "This email is already registered");
                                    }
                                });
                user.setEmail(newEmail);
            }
        }
        if (hasPassword) {
            user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        }

        return toProfileDto(userRepository.save(user));
    }

    @Transactional
    public void deleteTechnician(Long id, Long currentUserId) {
        if (id.equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot delete your own account");
        }
        User user =
                userRepository
                        .findByIdWithRoles(id)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        assertTechnicianAccount(user);
        if (user.getRoles() != null && user.getRoles().contains(Role.ADMIN)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Cannot delete an administrator account from the technician roster");
        }
        if (ticketRepository.countByReportedById(id) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This user has submitted tickets; reassign or archive those records before deleting");
        }
        ticketRepository.clearAssignmentForUser(id);
        commentRepository.deleteByAuthor_Id(id);
        userRepository.delete(user);
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
    public UserProfileDTO toggleUserStatus(Long id) {
        User user =
                userRepository
                        .findByIdWithRoles(id)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setEnabled(!user.isEnabled());
        return toProfileDto(userRepository.save(user));
    }

    private void assertTechnicianAccount(User user) {
        if (user.getRoles() == null || !user.getRoles().contains(Role.TECHNICIAN)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This account is not a technician");
        }
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
