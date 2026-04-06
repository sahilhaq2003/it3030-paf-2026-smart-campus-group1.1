package com.smartcampus.auth.config;

import com.smartcampus.user.model.Role;
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
public class AdminUserBootstrap implements ApplicationRunner {

    private static final String ADMIN_EMAIL = "admin@campus.com";
    private static final String ADMIN_PASSWORD = "admin@123";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Optional<User> existing = userRepository.findByEmail(ADMIN_EMAIL);
        if (existing.isPresent()) {
            User u = existing.get();
            boolean dirty = false;
            if (u.getPasswordHash() == null || u.getPasswordHash().isBlank()) {
                u.setPasswordHash(passwordEncoder.encode(ADMIN_PASSWORD));
                dirty = true;
            }
            if (!u.getRoles().contains(Role.ADMIN)) {
                u.getRoles().add(Role.ADMIN);
                dirty = true;
            }
            if (dirty) {
                userRepository.save(u);
            }
            return;
        }
        Set<Role> roles = new HashSet<>();
        roles.add(Role.ADMIN);
        roles.add(Role.USER);
        User admin =
                User.builder()
                        .email(ADMIN_EMAIL)
                        .name("Campus Administrator")
                        .passwordHash(passwordEncoder.encode(ADMIN_PASSWORD))
                        .provider(User.AuthProvider.LOCAL)
                        .roles(roles)
                        .enabled(true)
                        .build();
        userRepository.save(admin);
    }
}
