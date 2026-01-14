package com.dietician.service;

import com.dietician.dto.UserProfileDto;
import com.dietician.model.User;
import com.dietician.model.UserProfile;
import com.dietician.repository.UserRepository;
import com.dietician.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Period;

/**
 * Service for managing user profile operations
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final AuditLogService auditLogService;

    /**
     * Get user profile by user ID
     */
    @Transactional(readOnly = true)
    public UserProfileDto.ProfileResponse getProfile(Long userId) {
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElse(null);
        return mapToResponse(profile);
    }

    /**
     * Update or create user profile
     */
    @Transactional
    public UserProfileDto.ProfileResponse updateProfile(
            Long userId,
            UserProfileDto.UpdateProfileRequest request) {

        UserProfile profile = profileRepository.findByUserId(userId)
                .orElse(null);

        if (profile == null || profile.getId() == null) {
            // Only create if truly doesn't exist
            log.info("Creating new profile for user: {}", userId);
            profile = createDefaultProfile(userId);
        } else {
            log.info("Updating existing profile for user: {} (profile ID: {})", userId, profile.getId());
        }

        // Update fields
        profile.setFirstName(request.getFirstName());
        profile.setMiddleName(request.getMiddleName());
        profile.setLastName(request.getLastName());
        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setGender(request.getGender());
        profile.setCountryCode(request.getCountryCode());
        profile.setMobileNumber(request.getMobileNumber());
        profile.setCountry(request.getCountry());
        profile.setState(request.getState());
        profile.setAddressLine(request.getAddressLine());
        profile.setPincode(request.getPincode());

        profile = profileRepository.save(profile);
        log.info("Profile saved for user: {} (profile ID: {})", userId, profile.getId());

        // Create audit log
        String action = (profile.getId() != null && profile.getCreatedBy() != null) ? "UPDATE" : "INSERT";
        auditLogService.createAuditLog("user_profiles", profile.getId(), action, userId != null ? userId.toString() : "SYSTEM", null);

        return mapToResponse(profile);
    }

    /**
     * Upload profile photo
     */
    @Transactional
    public UserProfileDto.PhotoUploadResponse uploadProfilePhoto(Long userId, MultipartFile file) {
        // Validate file
        if (file.isEmpty()) {
            throw new RuntimeException("Please select a file to upload");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed");
        }

        // Validate file size (max 5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("File size must not exceed 5MB");
        }

        // Get or create profile
        UserProfile profile = profileRepository.findByUserId(userId).orElse(null);

        if (profile == null || profile.getId() == null) {
            // Create new profile if doesn't exist
            log.info("Creating new profile for photo upload for user: {}", userId);
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            profile = UserProfile.builder()
                    .user(user)
                    .build();
            profile = profileRepository.save(profile);
        } else {
            log.info("Updating photo for existing profile for user: {} (profile ID: {})", userId, profile.getId());
        }

        // Delete old photo if exists
        if (profile.getProfilePhotoUrl() != null) {
            String oldFilename = extractFilename(profile.getProfilePhotoUrl());
            try {
                fileStorageService.deleteFile("profile-photos", oldFilename);
            } catch (Exception e) {
                log.warn("Failed to delete old photo: {}", e.getMessage());
            }
        }

        // Upload new file
        String fileUrl = fileStorageService.storeFile(file, "profile-photos", userId.toString());
        profile.setProfilePhotoUrl(fileUrl);
        profileRepository.save(profile);

        log.info("Profile photo uploaded for user: {}", userId);

        // Create audit log
        auditLogService.createAuditLog("user_profiles", profile.getId(), "UPDATE", userId != null ? userId.toString() : "SYSTEM", null);

        UserProfileDto.PhotoUploadResponse response = new UserProfileDto.PhotoUploadResponse();
        response.setMessage("Profile photo uploaded successfully");
        response.setProfilePhotoUrl(fileUrl);
        return response;
    }

    /**
     * Create default profile for user
     */
    private UserProfile createDefaultProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfile profile = UserProfile.builder()
                .user(user)
                .build();
        return profileRepository.save(profile);
    }

    /**
     * Map entity to response DTO
     */
    private UserProfileDto.ProfileResponse mapToResponse(UserProfile profile) {
        if (profile == null) {
            return new UserProfileDto.ProfileResponse();
        }

        UserProfileDto.ProfileResponse response = new UserProfileDto.ProfileResponse();
        response.setId(profile.getId());
        response.setUserId(profile.getUser().getId());
        response.setFirstName(profile.getFirstName());
        response.setMiddleName(profile.getMiddleName());
        response.setLastName(profile.getLastName());
        response.setDateOfBirth(profile.getDateOfBirth());
        response.setAge(calculateAge(profile.getDateOfBirth()));
        response.setGender(profile.getGender());
        response.setCountryCode(profile.getCountryCode());
        response.setMobileNumber(profile.getMobileNumber());

        // Combine country code and mobile number
        if (profile.getCountryCode() != null && profile.getMobileNumber() != null) {
            response.setFullPhoneNumber(profile.getCountryCode() + " " + profile.getMobileNumber());
        }

        response.setEmail(profile.getUser().getEmail());
        response.setCountry(profile.getCountry());
        response.setState(profile.getState());
        response.setAddressLine(profile.getAddressLine());
        response.setPincode(profile.getPincode());
        response.setProfilePhotoUrl(profile.getProfilePhotoUrl());
        response.setEmailVerified(profile.getUser().getEmailVerified());

        // Build full name
        StringBuilder fullName = new StringBuilder();
        if (profile.getFirstName() != null) {
            fullName.append(profile.getFirstName());
        }
        if (profile.getMiddleName() != null && !profile.getMiddleName().isEmpty()) {
            if (fullName.length() > 0) fullName.append(" ");
            fullName.append(profile.getMiddleName());
        }
        if (profile.getLastName() != null) {
            if (fullName.length() > 0) fullName.append(" ");
            fullName.append(profile.getLastName());
        }
        response.setFullName(fullName.length() > 0 ? fullName.toString() : profile.getUser().getFullName());

        return response;
    }

    /**
     * Calculate age from date of birth
     */
    private Integer calculateAge(java.time.LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            return null;
        }
        return Period.between(dateOfBirth, java.time.LocalDate.now()).getYears();
    }

    /**
     * Extract filename from URL
     */
    private String extractFilename(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }
        String[] parts = url.split("/");
        return parts[parts.length - 1];
    }
}
