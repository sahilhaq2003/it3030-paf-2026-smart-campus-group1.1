package com.smartcampus.auth.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LecturerOtpService {

    private static final long OTP_TTL_SECONDS = 300; // 5 minutes
    private static final long VERIFIED_TOKEN_TTL_SECONDS = 600; // 10 minutes
    private static final SecureRandom RNG = new SecureRandom();

    private final Map<String, OtpEntry> store = new ConcurrentHashMap<>();
    private final Map<String, VerifiedEntry> verifiedStore = new ConcurrentHashMap<>();

    public String issueOtp(String emailKey) {
        String otp = String.format("%06d", RNG.nextInt(1_000_000));
        store.put(emailKey, new OtpEntry(otp, Instant.now().plusSeconds(OTP_TTL_SECONDS)));
        return otp;
    }

    public boolean verifyAndConsume(String emailKey, String otp) {
        OtpEntry entry = store.get(emailKey);
        if (entry == null) return false;
        if (Instant.now().isAfter(entry.expiresAt())) {
            store.remove(emailKey);
            return false;
        }
        boolean ok = entry.code().equals(otp);
        if (ok) {
            store.remove(emailKey);
        }
        return ok;
    }

    public String verifyOtpAndIssueToken(String emailKey, String otp) {
        if (!verifyAndConsume(emailKey, otp)) {
            return null;
        }
        String token = UUID.randomUUID().toString();
        verifiedStore.put(token, new VerifiedEntry(emailKey, Instant.now().plusSeconds(VERIFIED_TOKEN_TTL_SECONDS)));
        return token;
    }

    public boolean consumeVerifiedToken(String emailKey, String token) {
        VerifiedEntry entry = verifiedStore.get(token);
        if (entry == null) return false;
        if (Instant.now().isAfter(entry.expiresAt())) {
            verifiedStore.remove(token);
            return false;
        }
        boolean ok = entry.emailKey().equals(emailKey);
        if (ok) {
            verifiedStore.remove(token);
        }
        return ok;
    }

    private record OtpEntry(String code, Instant expiresAt) {}
    private record VerifiedEntry(String emailKey, Instant expiresAt) {}
}
