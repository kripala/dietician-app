package com.dietician.controller;

import com.dietician.dto.UserProfileDto;
import com.dietician.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
        log.info("Uploading photo for user: {}", userId);
        UserProfileDto.PhotoUploadResponse response = profileService.uploadProfilePhoto(userId, file);
        return ResponseEntity.ok(response);
    }

    /**
     * Global exception handler for this controller
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<UserProfileDto.MessageResponse> handleRuntimeException(RuntimeException ex) {
        log.error("Error occurred during profile request", ex);
        return ResponseEntity.badRequest().body(new UserProfileDto.MessageResponse(ex.getMessage()));
    }
}
