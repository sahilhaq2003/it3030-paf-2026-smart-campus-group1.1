package com.smartcampus.booking.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingQrEmailServiceImpl implements BookingQrEmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:}")
    private String from;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("classpath:/templates/booking-qr-email.html")
    private Resource qrTemplate;

    @Override
    public void sendQrEmail(Long bookingId, String recipientEmail, String recipientName,
                             String facilityName, String bookingDate,
                             String startTime, String endTime) {
        if (!mailEnabled) {
            log.info("Mail disabled — skipping QR email for bookingId={}", bookingId);
            return;
        }
        if (recipientEmail == null || recipientEmail.isBlank()) return;

        String effectiveFrom = (from != null && !from.isBlank()) ? from : mailUsername;
        if (effectiveFrom == null || effectiveFrom.isBlank()) {
            log.warn("Mail from address missing — skipping QR email");
            return;
        }

        try {
            // 1. Build verify URL
            String verifyUrl = frontendUrl + "/verify/" + bookingId;

            // 2. Generate QR code image
            byte[] qrBytes = generateQrCode(verifyUrl, 200);

            // 3. Load and fill HTML template
            String html = new String(
                    qrTemplate.getInputStream().readAllBytes(), StandardCharsets.UTF_8)
                    .replace("{{recipientName}}", escapeHtml(recipientName))
                    .replace("{{facilityName}}", escapeHtml(facilityName))
                    .replace("{{bookingDate}}", escapeHtml(bookingDate))
                    .replace("{{startTime}}", escapeHtml(startTime))
                    .replace("{{endTime}}", escapeHtml(endTime))
                    .replace("{{reference}}", "BOOKING#" + bookingId);

            // 4. Build and send email with inline QR image
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(effectiveFrom);
            helper.setTo(recipientEmail);
            helper.setSubject("Your Booking QR Code — " + facilityName);
            helper.setText(html, true);
            helper.addInline("qrcode", new ByteArrayResource(qrBytes), "image/png");

            mailSender.send(mimeMessage);
            log.info("QR email sent to {} for bookingId={}", recipientEmail, bookingId);

        } catch (Exception e) {
            log.error("Failed to send QR email for bookingId={}: {}", bookingId, e.getMessage());
        }
    }

    private byte[] generateQrCode(String text, int size) throws Exception {
        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix bitMatrix = writer.encode(text, BarcodeFormat.QR_CODE, size, size);
        BufferedImage image = MatrixToImageWriter.toBufferedImage(bitMatrix);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", baos);
        return baos.toByteArray();
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