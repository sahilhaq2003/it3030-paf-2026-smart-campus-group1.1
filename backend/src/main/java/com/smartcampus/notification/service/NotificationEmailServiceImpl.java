package com.smartcampus.notification.service;

import com.smartcampus.notification.model.Notification;
import com.smartcampus.user.model.Role;
import com.smartcampus.user.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.MessagingException;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;

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

    @Value("classpath:/templates/system-notification-email.html")
    private Resource templateResource;

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

        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setFrom(effectiveFrom);
            helper.setTo(recipient.getEmail());
            helper.setSubject(
                    notification.getTitle() != null
                            ? notification.getTitle()
                            : "Smart Campus Notification");
            helper.setText(buildHtml(recipient, notification), true);
        } catch (MessagingException e) {
            log.error("Failed to build notification email content: {}", e.getMessage());
            return;
        }

        try {
            mailSender.send(mimeMessage);
        } catch (MailException e) {
            // Don't break the main request if email fails.
            log.error("Failed to send notification email to {}: {}", recipient.getEmail(), e.getMessage());
        }
    }

    private String buildHtml(User recipient, Notification n) {
        String rawTemplate = "";
        try {
            rawTemplate = new String(templateResource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("Email template not readable; falling back to basic HTML. error={}", e.getMessage());
        }

        String title = escapeHtml(n.getTitle() != null ? n.getTitle() : "Smart Campus Notification");
        String message = escapeHtml(n.getMessage() != null ? n.getMessage() : "");
        String recipientName = escapeHtml(recipient.getName() != null ? recipient.getName() : "User");

        String reference = "N/A";
        if (n.getReferenceType() != null && n.getReferenceId() != null) {
            reference =
                    escapeHtml(n.getReferenceType().toString())
                            + "#"
                            + escapeHtml(String.valueOf(n.getReferenceId()));
        }

        if (rawTemplate == null || rawTemplate.isBlank()) {
            return "<html><body style='font-family:Arial,sans-serif;background:#f5f7fb;padding:24px;'>" +
                    "<div style='max-width:640px;margin:0 auto;background:#fff;border-radius:16px;padding:20px;'>" +
                    "<h2 style='margin-top:0;color:#4f46e5;'>" + title + "</h2>" +
                    "<p style='color:#0f172a;white-space:pre-wrap;'>" + message + "</p>" +
                    "<p style='color:#64748b;'>" +
                    "<strong>Do not reply</strong><br/>This is a system generated notification email." +
                    "</p>" +
                    "</div></body></html>";
        }

        return rawTemplate
                .replace("{{title}}", title)
                .replace("{{message}}", message)
                .replace("{{recipientName}}", recipientName)
                .replace("{{reference}}", reference);
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
