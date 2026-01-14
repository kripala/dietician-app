package com.dietician.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

public final class EmailHashUtil {
    private EmailHashUtil() {}

    public static String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    public static String hash(String email) {
        try {
            String normalized = normalize(email);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(normalized.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
