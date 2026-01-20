package com.dietician.service;

import com.dietician.dto.UserProfileDto;
import com.dietician.model.User;
import com.dietician.model.UserProfile;
import com.dietician.repository.UserProfileRepository;
import com.dietician.util.EmailHashUtil;
import com.dietician.util.EncryptionUtil;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Period;

/**
 * Service for managing user profile operations
 * Uses native queries to avoid encrypted email field issues
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository profileRepository;
    private final EntityManager entityManager;
    private final FileStorageService fileStorageService;
    private final AuditLogService auditLogService;
    private final com.dietician.security.JwtTokenProvider tokenProvider;

    /**
     * Get user profile by user ID
     */
    @Transactional(readOnly = true)
    public UserProfileDto.ProfileResponse getProfile(Long userId) {
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElse(null);
        return mapToResponse(profile, null, null, null, false);
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

        // Handle email update if provided
        String currentEmail = null;
        boolean emailChanged = false;
        String newAccessToken = null;
        String newRefreshToken = null;

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            // Normalize the email for consistency
            String normalizedEmail = EmailHashUtil.normalize(request.getEmail());

            // Get current email hash to check if email changed
            try {
                Object result = entityManager.createNativeQuery(
                        "SELECT email_search FROM diet.users WHERE id = :userId")
                        .setParameter("userId", userId)
                        .getSingleResult();
                if (result != null) {
                    String currentEmailHash = (String) result;
                    String newEmailHash = EmailHashUtil.hash(normalizedEmail);
                    if (!currentEmailHash.equals(newEmailHash)) {
                        // Email changed, update it
                        EncryptionUtil encryptionUtil = new EncryptionUtil("dGhpc2lzYXNlY3JldGtleWZvcmVuY3J5cHRpb24=");
                        String encryptedEmail = encryptionUtil.encrypt(normalizedEmail);

                        int updatedRows = entityManager.createNativeQuery("""
                                UPDATE diet.users
                                SET email = :email, email_search = :emailSearch
                                WHERE id = :userId
                                """)
                                .setParameter("email", encryptedEmail)
                                .setParameter("emailSearch", newEmailHash)
                                .setParameter("userId", userId)
                                .executeUpdate();

                        // Flush to ensure the update is executed immediately
                        entityManager.flush();

                        if (updatedRows > 0) {
                            emailChanged = true;
                            log.info("Email updated for user: {} from hash: {} to hash: {}", userId, currentEmailHash.substring(0, 8) + "...", newEmailHash.substring(0, 8) + "...");
                            auditLogService.createAuditLog("users", userId, "EMAIL_UPDATE", normalizedEmail, null);

                            // Generate new JWT tokens with the new email
                            newAccessToken = tokenProvider.generateToken(normalizedEmail);
                            newRefreshToken = tokenProvider.generateRefreshToken(normalizedEmail);
                            log.info("New JWT tokens generated for user: {} after email update", userId);
                        } else {
                            log.warn("No rows updated when trying to update email for user: {}", userId);
                        }
                    } else {
                        log.info("Email hash unchanged for user: {}, no update needed", userId);
                    }
                }
                // Set currentEmail to the normalized email for the response
                currentEmail = normalizedEmail;
            } catch (Exception e) {
                log.error("Error checking/updating email for user: {}", userId, e);
                // Still set currentEmail even if there was an error
                currentEmail = normalizedEmail;
            }
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

        return mapToResponse(profile, currentEmail, newAccessToken, newRefreshToken, emailChanged);
    }

    /**
     * Upload profile photo
     * Uses native query to avoid encrypted email field
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

        // Check if user exists using native query
        Long userCount = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM diet.users WHERE id = :userId")
                .setParameter("userId", userId)
                .getSingleResult()).longValue();

        if (userCount == 0) {
            throw new RuntimeException("User not found");
        }

        // Get or create profile
        UserProfile profile = profileRepository.findByUserId(userId).orElse(null);

        if (profile == null || profile.getId() == null) {
            // Create new profile using native insert to avoid loading User entity
            log.info("Creating new profile for photo upload for user: {}", userId);
            Long newProfileId = ((Number) entityManager.createNativeQuery("""
                    INSERT INTO diet.user_profiles (user_id, created_by, created_date)
                    VALUES (:userId, 'SYSTEM', now())
                    RETURNING id
                    """)
                    .setParameter("userId", userId)
                    .getSingleResult()).longValue();
            profile = profileRepository.findById(newProfileId).orElse(null);
            log.info("Created new profile with ID: {} for user: {}", newProfileId, userId);
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
     * Uses native query to avoid encrypted email field
     */
    private UserProfile createDefaultProfile(Long userId) {
        // Check if user exists using native query
        Long userCount = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM diet.users WHERE id = :userId")
                .setParameter("userId", userId)
                .getSingleResult()).longValue();

        if (userCount == 0) {
            throw new RuntimeException("User not found");
        }

        // Check if profile already exists for this user
        Long existingProfile = null;
        try {
            existingProfile = ((Number) entityManager.createNativeQuery(
                    "SELECT id FROM diet.user_profiles WHERE user_id = :userId")
                    .setParameter("userId", userId)
                    .getSingleResult()).longValue();
        } catch (Exception e) {
            // No existing profile found, will create new one
            log.debug("No existing profile found for user: {}", userId);
        }

        if (existingProfile != null) {
            // Return existing profile
            return profileRepository.findById(existingProfile).orElse(null);
        }

        // Create profile using native insert to avoid loading User entity
        Long newProfileId = ((Number) entityManager.createNativeQuery("""
                INSERT INTO diet.user_profiles (user_id, created_by, created_date)
                VALUES (:userId, 'SYSTEM', now())
                RETURNING id
                """)
                .setParameter("userId", userId)
                .getSingleResult()).longValue();

        // Return the newly created profile by fetching it using the new profile ID
        return profileRepository.findById(newProfileId).orElse(null);
    }

    /**
     * Map entity to response DTO
     * Uses native query to avoid loading User entity with encrypted email
     */
    private UserProfileDto.ProfileResponse mapToResponse(UserProfile profile, String email,
                                                         String accessToken, String refreshToken, boolean emailChanged) {
        if (profile == null) {
            return new UserProfileDto.ProfileResponse();
        }

        UserProfileDto.ProfileResponse response = new UserProfileDto.ProfileResponse();
        response.setId(profile.getId());
        response.setUserId(profile.getUserId()); // Use userId field directly
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

        // Get user data using native query to avoid encrypted email
        Object[] userData = null;
        try {
            userData = (Object[]) entityManager.createNativeQuery(
                    "SELECT u.full_name, u.email_verified FROM diet.users u WHERE u.id = :userId")
                    .setParameter("userId", profile.getUserId())
                    .getSingleResult();
        } catch (Exception e) {
            log.warn("Could not fetch user data for profile: {}", profile.getId());
        }

        String userFullName = null;
        Boolean emailVerified = null;
        if (userData != null) {
            userFullName = (String) userData[0];
            emailVerified = (Boolean) userData[1];
        }

        // Include email if provided
        response.setEmail(email);
        response.setCountry(profile.getCountry());
        response.setState(profile.getState());
        response.setAddressLine(profile.getAddressLine());
        response.setPincode(profile.getPincode());
        response.setProfilePhotoUrl(profile.getProfilePhotoUrl());
        response.setEmailVerified(emailVerified);

        // Set JWT tokens if email was changed
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setEmailChanged(emailChanged);

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
        response.setFullName(fullName.length() > 0 ? fullName.toString() : userFullName);

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
