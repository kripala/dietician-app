package com.dietician.controller;

import com.dietician.dto.AuthDto;
import com.dietician.service.AuthService;
import com.dietician.util.EncryptionUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST API endpoints for authentication operations.
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EncryptionUtil encryptionUtil;
    private final Environment environment;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    /**
     * Register a new user with email and password
     */
    @PostMapping("/register")
    public ResponseEntity<AuthDto.MessageResponse> register(@Valid @RequestBody AuthDto.RegisterRequest request) {
        log.info("Registration request received for email: {}", request.getEmail());
        AuthDto.MessageResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Login with email and password
     */
    @PostMapping("/login")
    public ResponseEntity<AuthDto.AuthResponse> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        log.info("Login request received for email: {}", request.getEmail());
        AuthDto.AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Verify email with OTP code
     */
    @PostMapping("/verify-email")
    public ResponseEntity<AuthDto.AuthResponse> verifyEmail(@Valid @RequestBody AuthDto.VerifyOtpRequest request) {
        log.info("Email verification request received for: {}", request.getEmail());
        AuthDto.AuthResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Resend OTP code
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<AuthDto.MessageResponse> resendOtp(@Valid @RequestBody AuthDto.ResendOtpRequest request) {
        log.info("Resend OTP request received for: {}", request.getEmail());
        AuthDto.MessageResponse response = authService.resendOtp(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Refresh access token
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthDto.AuthResponse> refreshToken(@Valid @RequestBody AuthDto.RefreshTokenRequest request) {
        log.info("Token refresh request received");
        AuthDto.AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Logout (client-side token removal)
     */
    @PostMapping("/logout")
    public ResponseEntity<AuthDto.MessageResponse> logout() {
        log.info("Logout request received");
        return ResponseEntity.ok(new AuthDto.MessageResponse("Logged out successfully"));
    }

    /**
     * Change password for authenticated user
     */
    @PostMapping("/change-password")
    public ResponseEntity<AuthDto.MessageResponse> changePassword(@Valid @RequestBody AuthDto.ChangePasswordRequest request) {
        log.info("Change password request received");
        AuthDto.MessageResponse response = authService.changePassword(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Health check endpoint with encryption status
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        // Test encryption/decryption to verify key is working
        try {
            String testData = "encryption-test-123";
            String encrypted = encryptionUtil.encrypt(testData);
            String decrypted = encryptionUtil.decrypt(encrypted);

            if (testData.equals(decrypted)) {
                return ResponseEntity.ok("OK - Encryption: Working");
            } else {
                log.error("Encryption health check failed: decrypted value doesn't match original");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("ERROR - Encryption: Not working correctly");
            }
        } catch (Exception e) {
            log.error("Encryption health check failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("ERROR - Encryption: " + e.getMessage());
        }
    }

    /**
     * Get Google OAuth configuration for frontend
     * Returns the Google Client ID and OAuth callback URL
     */
    @GetMapping("/oauth2/google/config")
    public ResponseEntity<Map<String, String>> getGoogleOAuthConfig() {
        Map<String, String> config = new HashMap<>();
        // Only return client ID if it's properly configured
        if (googleClientId != null && !googleClientId.equals("your-client-id")) {
            config.put("clientId", googleClientId);
            config.put("callbackUrl", "/auth/oauth2/callback/google");
            config.put("enabled", "true");
        } else {
            config.put("enabled", "false");
            config.put("message", "Google OAuth is not configured");
        }
        return ResponseEntity.ok(config);
    }
}
