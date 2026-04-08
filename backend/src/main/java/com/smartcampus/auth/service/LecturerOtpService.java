package com.smartcampus.auth.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LecturerOtpService {

    private static final long OTP_TTL_SECONDS = 300; // 5 minutes
    private static final SecureRandom RNG = new SecureRandom();

    private final Map<String, OtpEntry> store = new ConcurrentHashMap<>();

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

    private record OtpEntry(String code, Instant expiresAt) {}
}
