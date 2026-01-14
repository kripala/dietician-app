package com.dietician.controller;

import com.dietician.dto.AuthDto;
import com.dietician.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST API endpoints for authentication operations.
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

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
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }

    /**
     * Global exception handler for this controller
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<AuthDto.MessageResponse> handleRuntimeException(RuntimeException ex) {
        log.error("Error occurred during auth request", ex);
        return ResponseEntity.badRequest().body(new AuthDto.MessageResponse(ex.getMessage()));
    }
}
