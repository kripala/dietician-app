package com.dietician.controller;

import com.dietician.dto.AuthDto;
import com.dietician.dto.UserProfileDto;
import com.dietician.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.security.Principal;

/**
 * REST API endpoints for user profile operations
 */
@Slf4j
@RestController
@RequestMapping("/user-profiles")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService profileService;

    /**
     * Get current user's profile
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileDto.ProfileResponse> getMyProfile(
            @RequestParam Long userId) {
        log.info("Fetching profile for user: {}", userId);
        UserProfileDto.ProfileResponse profile = profileService.getProfile(userId);
        return ResponseEntity.ok(profile);
    }

    /**
     * Update or create current user's profile
     */
    @PutMapping("/me")
    public ResponseEntity<UserProfileDto.ProfileResponse> updateMyProfile(
            @RequestParam Long userId,
            @Valid @RequestBody UserProfileDto.UpdateProfileRequest request) {
        log.info("Updating profile for user: {}", userId);
        UserProfileDto.ProfileResponse profile = profileService.updateProfile(userId, request);
        return ResponseEntity.ok(profile);
    }

    /**
     * Upload profile photo
     */
    @PostMapping("/me/photo")
    public ResponseEntity<UserProfileDto.PhotoUploadResponse> uploadPhoto(
            @RequestParam Long userId,
            @RequestParam("file") MultipartFile file) {
        log.info("Uploading photo for user: {}, file size: {} bytes", userId, file.getSize());
        UserProfileDto.PhotoUploadResponse response = profileService.uploadProfilePhoto(userId, file);
        return ResponseEntity.ok(response);
    }

    // ============================================
    // Email Change Verification Endpoints
    // ============================================

    /**
     * Send OTP to new email for email change verification
     * OAuth users will receive an error response directing them to use Google Sign-In
     */
    @PostMapping("/email/send-verification")
    public ResponseEntity<AuthDto.MessageResponse> sendEmailChangeVerification(
            @RequestParam Long userId,
            @Valid @RequestBody AuthDto.EmailChangeVerificationRequest request) {
        log.info("Sending email change verification for user: {} to email: {}", userId, request.getNewEmail());
        AuthDto.MessageResponse response = profileService.sendEmailChangeVerification(userId, request.getNewEmail());
        return ResponseEntity.ok(response);
    }

    /**
     * Confirm email change with OTP
     * Returns new JWT tokens with the updated email
     */
    @PostMapping("/email/confirm-change")
    public ResponseEntity<AuthDto.AuthResponse> confirmEmailChange(
            @RequestParam Long userId,
            @Valid @RequestBody AuthDto.EmailChangeConfirmRequest request) {
        log.info("Confirming email change for user: {} to email: {}", userId, request.getNewEmail());
        AuthDto.AuthResponse response = profileService.confirmEmailChange(userId, request.getNewEmail(), request.getOtpCode());
        return ResponseEntity.ok(response);
    }

    /**
     * Resend OTP for email change verification
     */
    @PostMapping("/email/resend-otp")
    public ResponseEntity<AuthDto.MessageResponse> resendEmailChangeOtp(
            @RequestParam Long userId,
            @Valid @RequestBody AuthDto.EmailChangeVerificationRequest request) {
        log.info("Resending email change OTP for user: {} to email: {}", userId, request.getNewEmail());
        AuthDto.MessageResponse response = profileService.resendEmailChangeOtp(userId, request.getNewEmail());
        return ResponseEntity.ok(response);
    }

    /**
     * Handle file size exceeded exception
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<UserProfileDto.MessageResponse> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException ex) {
        log.warn("File upload size exceeded: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(
                new UserProfileDto.MessageResponse("File size too large. Maximum allowed size is 5MB.")
        );
    }

    /**
     * Global exception handler for this controller
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<UserProfileDto.MessageResponse> handleRuntimeException(RuntimeException ex) {
        log.error("Error occurred during profile request", ex);

        // Provide user-friendly message for common errors
        String message = ex.getMessage();
        if (message != null && message.contains("ClassCastException")) {
            message = "An error occurred while processing your request. Please try again.";
        }

        return ResponseEntity.badRequest().body(new UserProfileDto.MessageResponse(message));
    }
}
