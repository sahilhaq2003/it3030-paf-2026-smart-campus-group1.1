package com.smartcampus.notification.service;

import com.smartcampus.notification.model.Notification;
import com.smartcampus.user.model.Role;
import com.smartcampus.user.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationEmailServiceImpl implements NotificationEmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:}")
    private String from;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Override
    public void sendNotificationEmail(User recipient, Notification notification) {
        if (!mailEnabled) return;
        if (recipient == null || recipient.getEmail() == null || recipient.getEmail().isBlank()) return;
        if (notification == null) return;
        if (recipient.getRoles() != null && recipient.getRoles().contains(Role.ADMIN)) {
            // Admins should not receive system emails; they use in-app notifications instead.
            return;
        }

        String effectiveFrom = (from != null && !from.isBlank()) ? from : mailUsername;
        if (effectiveFrom == null || effectiveFrom.isBlank()) {
            log.warn("Mail from address missing; skipping notification email for userId={}", recipient.getId());
            return;
        }

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(effectiveFrom);
        msg.setTo(recipient.getEmail());
        msg.setSubject(notification.getTitle() != null ? notification.getTitle() : "Smart Campus Notification");
        msg.setText(buildBody(notification));

        try {
            mailSender.send(msg);
        } catch (MailException e) {
            // Don't break the main request if email fails.
            log.error("Failed to send notification email to {}: {}", recipient.getEmail(), e.getMessage());
        }
    }

    private String buildBody(Notification n) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hello user,").append(System.lineSeparator());
        sb.append(System.lineSeparator());
        sb.append(n.getMessage() != null ? n.getMessage() : "").append(System.lineSeparator());
        if (n.getReferenceId() != null && n.getReferenceType() != null) {
            sb.append(System.lineSeparator());
            sb.append("Reference: ")
                    .append(n.getReferenceType())
                    .append("#")
                    .append(n.getReferenceId())
                    .append(System.lineSeparator());
        }
        sb.append(System.lineSeparator());
        sb.append("Do not reply to this email.").append(System.lineSeparator());
        sb.append("This is a system generated notification email.").append(System.lineSeparator());
        sb.append(System.lineSeparator());
        sb.append("Thanks, Smart Campus Team");
        return sb.toString();
    }
}

