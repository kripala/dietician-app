package com.dietician.service;

import com.dietician.dto.AuthDto;
import com.dietician.dto.UserProfileDto;
import com.dietician.model.User;
import com.dietician.model.UserProfile;
import com.dietician.repository.UserProfileRepository;
import com.dietician.repository.UserRepository;
import com.dietician.util.EmailHashUtil;
import com.dietician.util.EncryptionUtil;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.Optional;

/**
 * Service for managing user profile operations
 * Uses native queries to avoid encrypted email field issues
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final EntityManager entityManager;
    private final FileStorageService fileStorageService;
    private final AuditLogService auditLogService;
    private final EmailService emailService;
    private final com.dietician.security.JwtTokenProvider tokenProvider;
    private final EncryptionUtil encryptionUtil;
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Get user profile by user ID
     */
    @Transactional(readOnly = true)
    public UserProfileDto.ProfileResponse getProfile(Long userId) {
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElse(null);

        // Fetch email from database (decrypt it for the response)
        String email = null;
        Boolean isOAuthUser = false;
        if (profile != null) {
            try {
                Object[] result = (Object[]) entityManager.createNativeQuery(
                        "SELECT u.email, u.oauth_provider FROM diet.users u WHERE u.id = :userId")
                        .setParameter("userId", userId)
                        .getSingleResult();
                if (result != null && result[0] != null) {
                    String encryptedEmail = (String) result[0];
                    email = encryptionUtil.decrypt(encryptedEmail);
                }
                if (result != null && result[1] != null) {
                    isOAuthUser = true;
                }
            } catch (Exception e) {
                log.warn("Could not fetch email for user: {}", userId);
            }
        }

        return mapToResponse(profile, email, null, null, false, isOAuthUser);
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

        // Get current email for display (email cannot be changed via updateProfile anymore)
        // Email changes must go through the OTP verification flow
        String currentEmail = null;
        try {
            Object result = entityManager.createNativeQuery(
                    "SELECT email FROM diet.users WHERE id = :userId")
                    .setParameter("userId", userId)
                    .getSingleResult();
            if (result != null) {
                String encryptedEmail = (String) result;
                currentEmail = encryptionUtil.decrypt(encryptedEmail);
            }
        } catch (Exception e) {
            log.warn("Could not fetch email for user: {}", userId);
        }

        // Log if email was provided in request (but ignore it for security)
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            log.info("Email update request ignored for user: {}. Use email change verification flow instead.", userId);
        }

        // Update profile fields (email is NOT updated here)
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

        return mapToResponse(profile, currentEmail, null, null, false, false);
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
                                                         String accessToken, String refreshToken, boolean emailChanged, boolean isOAuthUser) {
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
        response.setIsOAuthUser(isOAuthUser);

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

    // ============================================
    // Email Change Verification Methods
    // ============================================

    /**
     * Send OTP to new email for email change verification
     * Uses JPA repository for checking OAuth user status
     */
    @Transactional
    public AuthDto.MessageResponse sendEmailChangeVerification(Long userId, String newEmail) {
        // Normalize email
        String normalizedEmail = EmailHashUtil.normalize(newEmail);

        // Check if user is OAuth user using JPA repository
        boolean isOAuthUser = userRepository.isOAuthUser(userId);
        if (isOAuthUser) {
            log.warn("OAuth user: {} attempted to change email via OTP flow", userId);
            return new AuthDto.MessageResponse(
                "OAuth users must use Google Sign-In to change their email. " +
                "Please sign in with your new Google account."
            );
        }

        // Check if new email already exists using JPA repository
        String newEmailHash = EmailHashUtil.hash(normalizedEmail);
        if (userRepository.existsByEmailSearch(newEmailHash)) {
            log.warn("Email change requested for existing email: {}", normalizedEmail);
            return new AuthDto.MessageResponse("This email is already registered. Please use a different email.");
        }

        // Generate 6-digit OTP
        String otpCode = String.format("%06d", secureRandom.nextInt(1000000));
        LocalDateTime otpExpiry = LocalDateTime.now().plusMinutes(5);

        // Store OTP in users table using JPA repository
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.error("User not found: {}", userId);
            return new AuthDto.MessageResponse("User not found.");
        }

        User user = userOpt.get();
        user.setOtpCode(otpCode);
        user.setOtpExpiry(otpExpiry);
        userRepository.save(user);

        log.info("Stored OTP for email change for user: {}, expires at: {}", userId, otpExpiry);

        // Send OTP to NEW email
        try {
            emailService.sendEmailChangeOtpEmail(normalizedEmail, otpCode, user.getFullName());
            log.info("OTP sent to new email: {} for user: {}", normalizedEmail, userId);
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {}", normalizedEmail, e);
            return new AuthDto.MessageResponse("Failed to send verification email. Please try again.");
        }

        return new AuthDto.MessageResponse(
            "A verification code has been sent to " + normalizedEmail +
            ". Please enter the code within 5 minutes to complete the email change."
        );
    }

    /**
     * Confirm email change with OTP verification
     * Updates email and generates new JWT tokens
     */
    @Transactional
    public AuthDto.AuthResponse confirmEmailChange(Long userId, String newEmail, String otpCode) {
        // Normalize email
        String normalizedEmail = EmailHashUtil.normalize(newEmail);
        String newEmailHash = EmailHashUtil.hash(normalizedEmail);

        // Get user with OTP using JPA repository
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found.");
        }

        User user = userOpt.get();

        // Verify OTP
        if (user.getOtpCode() == null || user.getOtpExpiry() == null) {
            throw new RuntimeException("No verification code found. Please request a new code.");
        }

        if (!user.getOtpCode().equals(otpCode)) {
            throw new RuntimeException("Invalid verification code. Please check and try again.");
        }

        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification code has expired. Please request a new code.");
        }

        // Check if new email already exists (in case another user registered with this email)
        if (userRepository.existsByEmailSearchAndIdNot(newEmailHash, userId)) {
            throw new RuntimeException("This email is already registered. Please use a different email.");
        }

        // Encrypt new email
        String encryptedEmail = encryptionUtil.encrypt(normalizedEmail);

        // Update email using JPA repository
        user.setEmail(encryptedEmail);
        user.setEmailSearch(newEmailHash);
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        user.setEmailVerified(true);
        userRepository.save(user);

        log.info("Email updated for user: {} to: {}", userId, normalizedEmail);

        // Create audit log
        auditLogService.createAuditLog("users", userId, "EMAIL_CHANGE", normalizedEmail, null);

        // Generate new JWT tokens with new email
        String accessToken = tokenProvider.generateToken(normalizedEmail);
        String refreshToken = tokenProvider.generateRefreshToken(normalizedEmail);

        // Build UserInfo response
        AuthDto.UserInfo userInfo = new AuthDto.UserInfo();
        userInfo.setId(user.getId());
        userInfo.setEmail(normalizedEmail);
        userInfo.setFullName(user.getFullName());
        userInfo.setRole(user.getRole().getRoleCode());
        userInfo.setEmailVerified(user.getEmailVerified());
        userInfo.setProfilePictureUrl(user.getProfilePictureUrl());

        return new AuthDto.AuthResponse(accessToken, refreshToken, 86400000L, userInfo);
    }

    /**
     * Resend OTP for email change verification
     */
    @Transactional
    public AuthDto.MessageResponse resendEmailChangeOtp(Long userId, String newEmail) {
        // Normalize email
        String normalizedEmail = EmailHashUtil.normalize(newEmail);

        // Check if user is OAuth user using JPA repository
        boolean isOAuthUser = userRepository.isOAuthUser(userId);
        if (isOAuthUser) {
            return new AuthDto.MessageResponse(
                "OAuth users must use Google Sign-In to change their email."
            );
        }

        // Check if new email already exists
        String newEmailHash = EmailHashUtil.hash(normalizedEmail);
        if (userRepository.existsByEmailSearch(newEmailHash)) {
            return new AuthDto.MessageResponse("This email is already registered.");
        }

        // Get user using JPA repository
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return new AuthDto.MessageResponse("User not found.");
        }

        User user = userOpt.get();

        // Generate new OTP
        String otpCode = String.format("%06d", secureRandom.nextInt(1000000));
        LocalDateTime otpExpiry = LocalDateTime.now().plusMinutes(5);

        // Update OTP
        user.setOtpCode(otpCode);
        user.setOtpExpiry(otpExpiry);
        userRepository.save(user);

        log.info("Resent OTP for email change for user: {}, expires at: {}", userId, otpExpiry);

        // Send OTP to new email
        try {
            emailService.sendEmailChangeOtpEmail(normalizedEmail, otpCode, user.getFullName());
            log.info("OTP resent to: {}", normalizedEmail);
        } catch (Exception e) {
            log.error("Failed to resend OTP email to: {}", normalizedEmail, e);
            return new AuthDto.MessageResponse("Failed to send verification email. Please try again.");
        }

        return new AuthDto.MessageResponse(
            "A new verification code has been sent to " + normalizedEmail +
            ". Please enter the code within 5 minutes."
        );
    }

    /**
     * Update email for OAuth users (direct update, no OTP required)
     * User will be logged out and must sign in with new Google account
     */
    @Transactional
    public UserProfileDto.ProfileResponse updateEmailForOAuthUser(Long userId, String newEmail) {
        // Normalize email
        String normalizedEmail = EmailHashUtil.normalize(newEmail);
        String newEmailHash = EmailHashUtil.hash(normalizedEmail);

        // Verify this is an OAuth user
        boolean isOAuthUser = userRepository.isOAuthUser(userId);
        if (!isOAuthUser) {
            throw new RuntimeException("This endpoint is only for OAuth users. Please use the email verification flow instead.");
        }

        // Check if new email already exists
        if (userRepository.existsByEmailSearchAndIdNot(newEmailHash, userId)) {
            throw new RuntimeException("This email is already registered. Please use a different email.");
        }

        // Get user
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found.");
        }

        User user = userOpt.get();

        // Encrypt new email
        String encryptedEmail = encryptionUtil.encrypt(normalizedEmail);

        // Update email
        user.setEmail(encryptedEmail);
        user.setEmailSearch(newEmailHash);
        user.setEmailVerified(true);
        userRepository.save(user);

        log.info("Email updated for OAuth user: {} to: {}", userId, normalizedEmail);

        // Create audit log
        auditLogService.createAuditLog("users", userId, "EMAIL_CHANGE", normalizedEmail, null);

        // Get profile for response
        UserProfile profile = profileRepository.findByUserId(userId).orElse(null);

        // Return response with forceLogout flag
        return mapToResponse(profile, normalizedEmail, null, null, true, true);
    }
}
