package com.smartcampus.auth.config;

import com.smartcampus.user.model.Role;
import com.smartcampus.user.model.TechnicianCategory;
import com.smartcampus.user.model.User;
import com.smartcampus.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class TechnicianUserBootstrap implements ApplicationRunner {

    private static final String TECH_EMAIL = "tech@campus.com";
    private static final String TECH_PASSWORD = "tech@123";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Optional<User> existing = userRepository.findByEmail(TECH_EMAIL);
        if (existing.isPresent()) {
            User u = existing.get();
            boolean dirty = false;
            if (u.getPasswordHash() == null || u.getPasswordHash().isBlank()) {
                u.setPasswordHash(passwordEncoder.encode(TECH_PASSWORD));
                dirty = true;
            }
            if (!u.getRoles().contains(Role.TECHNICIAN)) {
                u.getRoles().add(Role.TECHNICIAN);
                dirty = true;
            }
            if (!u.getRoles().contains(Role.USER)) {
                u.getRoles().add(Role.USER);
                dirty = true;
            }
            if (u.getTechnicianCategory() == null) {
                u.setTechnicianCategory(TechnicianCategory.OTHER);
                dirty = true;
            }
            if (dirty) {
                userRepository.save(u);
            }
            return;
        }
        Set<Role> roles = new HashSet<>();
        roles.add(Role.TECHNICIAN);
        roles.add(Role.USER);
        User tech =
                User.builder()
                        .email(TECH_EMAIL)
                        .name("Campus Technician")
                        .passwordHash(passwordEncoder.encode(TECH_PASSWORD))
                        .provider(User.AuthProvider.LOCAL)
                        .roles(roles)
                        .enabled(true)
                        .technicianCategory(TechnicianCategory.OTHER)
                        .build();
        userRepository.save(tech);
    }
}
