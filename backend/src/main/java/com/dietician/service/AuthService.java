package com.dietician.service;

import com.dietician.dto.AuthDto;
import com.dietician.model.Role;
import com.dietician.model.User;
import com.dietician.repository.RoleRepository;
import com.dietician.repository.UserRepository;
import com.dietician.util.EmailHashUtil;
import com.dietician.util.EncryptionUtil;
import com.dietician.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * Authentication service handling user registration, login, and OTP verification.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;
    private final AuditLogService auditLogService;
    private final EntityManager entityManager;
    private final EncryptionUtil encryptionUtil;
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Register a new user with email and password
     */
    @Transactional
    public AuthDto.MessageResponse register(AuthDto.RegisterRequest request) {
        // Check if user already exists
        String emailHash = EmailHashUtil.hash(request.getEmail());
        if (userRepository.existsByEmailSearch(emailHash)) {
            throw new RuntimeException("This email is already registered. Please log in or use a different email.");
        }

        // Generate OTP
        String otpCode = generateOtp();

        // Get PATIENT role
        Role patientRole = roleRepository.findByRoleCode("PATIENT")
                .orElseThrow(() -> new RuntimeException("System configuration error. Please contact support."));
        
        // Create user
        User user = User.builder()
                .email(request.getEmail())
                .emailSearch(emailHash)
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .emailVerified(false)
                .otpCode(otpCode)
                .otpExpiry(LocalDateTime.now().plusMinutes(5))
                .role(patientRole)
                .isActive(true)
                .build();

        userRepository.save(user);
        log.info("User registered successfully: {}", request.getEmail());

        // Create audit log
        auditLogService.createAuditLog("users", user.getId(), "INSERT", request.getEmail(), null);

        // Send OTP email
        emailService.sendOtpEmail(request.getEmail(), otpCode, request.getFullName());

        return new AuthDto.MessageResponse("Registration successful. Please check your email for OTP verification.");
    }

    /**
     * Login with email and password
     * Uses native query to avoid encrypted email field decryption issues
     */
    @Transactional(readOnly = true)
    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        String emailHash = EmailHashUtil.hash(request.getEmail());

        // Use native query to get user data without encrypted email
        // Include profile picture from user_profiles table
        String nativeQuery = """
            SELECT u.id, u.password, u.full_name, u.email_verified,
                   u.is_active, up.profile_photo_url,
                   r.id as role_id, r.role_code, r.role_name
            FROM diet.users u
            JOIN diet.roles r ON u.role_id = r.id
            LEFT JOIN diet.user_profiles up ON u.id = up.user_id
            WHERE u.email_search = :emailHash
            """;

        Query query = entityManager.createNativeQuery(nativeQuery);
        query.setParameter("emailHash", emailHash);

        Object[] result;
        try {
            result = (Object[]) query.getSingleResult();
        } catch (Exception e) {
            throw new RuntimeException("Invalid email or password");
        }

        Long userId = ((Number) result[0]).longValue();
        String password = (String) result[1];
        String fullName = (String) result[2];
        Boolean emailVerified = (Boolean) result[3];
        Boolean isActive = (Boolean) result[4];
        String profilePictureUrl = (String) result[5];
        String roleCode = (String) result[7];
        String roleName = (String) result[8];

        if (!Boolean.TRUE.equals(emailVerified)) {
            throw new RuntimeException("Please verify your email address before logging in. Check your inbox for the verification code.");
        }

        if (!Boolean.TRUE.equals(isActive)) {
            throw new RuntimeException("Your account has been deactivated. Please contact support.");
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), password)) {
            throw new RuntimeException("Invalid email or password");
        }

        // Generate tokens
        String accessToken = tokenProvider.generateToken(request.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(request.getEmail());

        log.info("User logged in successfully: {}", request.getEmail());

        // Create audit log
        auditLogService.createAuditLog("users", userId, "LOGIN", request.getEmail(), null);

        // Build response
        AuthDto.UserInfo userInfo = new AuthDto.UserInfo();
        userInfo.setId(userId);
        userInfo.setEmail(request.getEmail()); // Use the email from request, not from DB
        userInfo.setFullName(fullName);
        userInfo.setRole(roleCode);
        userInfo.setEmailVerified(emailVerified);
        userInfo.setProfilePictureUrl(profilePictureUrl);

        return new AuthDto.AuthResponse(
                accessToken,
                refreshToken,
                86400000L,
                userInfo
        );
    }

    /**
     * Verify OTP code
     * Uses native query to avoid encrypted email field
     */
    @Transactional
    public AuthDto.AuthResponse verifyOtp(AuthDto.VerifyOtpRequest request) {
        String emailHash = EmailHashUtil.hash(request.getEmail());

        // Use native query to get user data without encrypted email
        // Include profile picture from user_profiles table
        String nativeQuery = """
            SELECT u.id, u.otp_code, u.otp_expiry, u.full_name,
                   u.email_verified, u.is_active, up.profile_photo_url,
                   r.role_code
            FROM diet.users u
            JOIN diet.roles r ON u.role_id = r.id
            LEFT JOIN diet.user_profiles up ON u.id = up.user_id
            WHERE u.email_search = :emailHash
            """;

        Query query = entityManager.createNativeQuery(nativeQuery);
        query.setParameter("emailHash", emailHash);

        Object[] result;
        try {
            result = (Object[]) query.getSingleResult();
        } catch (Exception e) {
            throw new RuntimeException("User not found");
        }

        Long userId = ((Number) result[0]).longValue();
        String otpCode = (String) result[1];
        Object otpExpiryObj = result[2];
        String fullName = (String) result[3];
        Boolean emailVerified = (Boolean) result[4];
        Boolean isActive = (Boolean) result[5];
        String profilePictureUrl = (String) result[6];
        String roleCode = (String) result[7];

        // Check OTP
        if (otpCode == null || !otpCode.equals(request.getOtpCode())) {
            throw new RuntimeException("The verification code you entered is incorrect. Please check and try again.");
        }

        // Check expiry
        LocalDateTime otpExpiry = otpExpiryObj != null ? ((java.sql.Timestamp) otpExpiryObj).toLocalDateTime() : null;
        if (otpExpiry == null || LocalDateTime.now().isAfter(otpExpiry)) {
            throw new RuntimeException("The verification code has expired. Please request a new code.");
        }

        // Mark email as verified using native update
        entityManager.createNativeQuery("""
                UPDATE diet.users
                SET email_verified = true, otp_code = NULL, otp_expiry = NULL
                WHERE id = :userId
                """)
                .setParameter("userId", userId)
                .executeUpdate();

        log.info("Email verified successfully: {}", request.getEmail());

        // Send welcome email
        emailService.sendWelcomeEmail(request.getEmail(), fullName);

        // Generate tokens
        String accessToken = tokenProvider.generateToken(request.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(request.getEmail());

        // Build response
        AuthDto.UserInfo userInfo = new AuthDto.UserInfo();
        userInfo.setId(userId);
        userInfo.setEmail(request.getEmail());
        userInfo.setFullName(fullName);
        userInfo.setRole(roleCode);
        userInfo.setEmailVerified(true);
        userInfo.setProfilePictureUrl(profilePictureUrl);

        return new AuthDto.AuthResponse(
                accessToken,
                refreshToken,
                86400000L,
                userInfo
        );
    }

    /**
     * Resend OTP code
     * Uses native query to avoid encrypted email field
     */
    @Transactional
    public AuthDto.MessageResponse resendOtp(AuthDto.ResendOtpRequest request) {
        String emailHash = EmailHashUtil.hash(request.getEmail());

        // Use native query to get user data without encrypted email
        String nativeQuery = """
            SELECT u.id, u.email_verified, u.full_name
            FROM diet.users u
            WHERE u.email_search = :emailHash
            """;

        Object[] result;
        try {
            result = (Object[]) entityManager.createNativeQuery(nativeQuery)
                    .setParameter("emailHash", emailHash)
                    .getSingleResult();
        } catch (Exception e) {
            throw new RuntimeException("User not found");
        }

        Long userId = ((Number) result[0]).longValue();
        Boolean emailVerified = (Boolean) result[1];
        String fullName = (String) result[2];

        if (Boolean.TRUE.equals(emailVerified)) {
            throw new RuntimeException("This email has already been verified. You can now log in.");
        }

        // Generate new OTP
        String otpCode = generateOtp();

        // Update OTP using native query
        entityManager.createNativeQuery("""
                UPDATE diet.users
                SET otp_code = :otpCode, otp_expiry = now() + interval '5 minutes'
                WHERE id = :userId
                """)
                .setParameter("otpCode", otpCode)
                .setParameter("userId", userId)
                .executeUpdate();

        // Send OTP email
        emailService.sendOtpEmail(request.getEmail(), otpCode, fullName);

        log.info("OTP resent to: {}", request.getEmail());

        return new AuthDto.MessageResponse("OTP code has been resent to your email");
    }

    /**
     * Refresh access token
     * Uses native query to avoid encrypted email field
     */
    public AuthDto.AuthResponse refreshToken(AuthDto.RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!tokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Your session has expired. Please log in again.");
        }

        String email = tokenProvider.getUsernameFromToken(refreshToken);
        String emailHash = EmailHashUtil.hash(email);

        // Use native query to get user data without encrypted email
        // Include profile picture from user_profiles table
        String nativeQuery = """
            SELECT u.id, u.full_name, u.email_verified,
                   u.is_active, up.profile_photo_url, r.role_code
            FROM diet.users u
            JOIN diet.roles r ON u.role_id = r.id
            LEFT JOIN diet.user_profiles up ON u.id = up.user_id
            WHERE u.email_search = :emailHash
            """;

        Query query = entityManager.createNativeQuery(nativeQuery);
        query.setParameter("emailHash", emailHash);

        Object[] result;
        try {
            result = (Object[]) query.getSingleResult();
        } catch (Exception e) {
            throw new RuntimeException("Account not found. Please log in again.");
        }

        Long userId = ((Number) result[0]).longValue();
        String fullName = (String) result[1];
        Boolean emailVerified = (Boolean) result[2];
        Boolean isActive = (Boolean) result[3];
        String profilePictureUrl = (String) result[4];
        String roleCode = (String) result[5];

        if (!Boolean.TRUE.equals(isActive)) {
            throw new RuntimeException("Your account has been deactivated. Please contact support.");
        }

        String newAccessToken = tokenProvider.generateToken(email);

        // Build response
        AuthDto.UserInfo userInfo = new AuthDto.UserInfo();
        userInfo.setId(userId);
        userInfo.setEmail(email);
        userInfo.setFullName(fullName);
        userInfo.setRole(roleCode);
        userInfo.setEmailVerified(emailVerified);
        userInfo.setProfilePictureUrl(profilePictureUrl);

        return new AuthDto.AuthResponse(
                newAccessToken,
                refreshToken,
                86400000L,
                userInfo
        );
    }

    /**
     * Change password for authenticated user
     * Uses native query to avoid encrypted email field
     */
    @Transactional
    public AuthDto.MessageResponse changePassword(AuthDto.ChangePasswordRequest request) {
        // Get authenticated user email from security context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        String email = authentication.getName();
        String emailHash = EmailHashUtil.hash(email);

        // Use native query to get user data including google_id
        String nativeQuery = """
            SELECT u.id, u.password, u.google_id
            FROM diet.users u
            WHERE u.email_search = :emailHash
            """;

        Query query = entityManager.createNativeQuery(nativeQuery);
        query.setParameter("emailHash", emailHash);

        Object[] result;
        try {
            result = (Object[]) query.getSingleResult();
        } catch (Exception e) {
            throw new RuntimeException("User not found");
        }

        Long userId = ((Number) result[0]).longValue();
        String password = (String) result[1];
        String googleId = (String) result[2];

        // Check if user is OAuth-only (has google_id but no password)
        if (googleId != null && password == null) {
            throw new RuntimeException(
                "You signed in with Google. Password management is not available for Google accounts. " +
                "Please use Google Sign-In to access your account."
            );
        }

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), password)) {
            throw new RuntimeException("Current password is incorrect");
        }

        // Check if new password is same as current password
        if (passwordEncoder.matches(request.getNewPassword(), password)) {
            throw new RuntimeException("New password must be different from current password");
        }

        // Encode and save new password
        String encodedPassword = passwordEncoder.encode(request.getNewPassword());
        entityManager.createNativeQuery("""
                UPDATE diet.users SET password = :password WHERE id = :userId
                """)
                .setParameter("password", encodedPassword)
                .setParameter("userId", userId)
                .executeUpdate();

        log.info("Password changed successfully for user: {}", email);

        // Create audit log
        auditLogService.createAuditLog("users", userId, "PASSWORD_CHANGE", email, null);

        return new AuthDto.MessageResponse("Password changed successfully");
    }

    /**
     * Handle Google OAuth login
     * Uses native queries to avoid encrypted email field issues
     */
    @Transactional
    public AuthDto.AuthResponse handleOAuthLogin(String email, String googleId, String fullName, String pictureUrl) {
        String emailHash = EmailHashUtil.hash(email);

        // Check if user exists by Google ID
        Object[] googleUser = null;
        try {
            googleUser = (Object[]) entityManager.createNativeQuery(
                    "SELECT u.id, u.full_name, u.profile_picture_url, r.role_code " +
                    "FROM diet.users u JOIN diet.roles r ON u.role_id = r.id " +
                    "WHERE u.google_id = :googleId")
                    .setParameter("googleId", googleId)
                    .getSingleResult();
        } catch (Exception e) {
            // User not found by Google ID, continue to check by email
        }

        if (googleUser != null) {
            // User exists with this Google ID - update profile picture if it has changed
            Long userId = ((Number) googleUser[0]).longValue();
            String currentPictureUrl = (String) googleUser[2];

            // Update profile picture from Google if it has changed
            if (pictureUrl != null && !pictureUrl.equals(currentPictureUrl)) {
                entityManager.createNativeQuery(
                        "UPDATE diet.users SET profile_picture_url = :pictureUrl WHERE id = :userId")
                        .setParameter("pictureUrl", pictureUrl)
                        .setParameter("userId", userId)
                        .executeUpdate();

                // Also update profile photo in user_profiles table
                entityManager.createNativeQuery(
                        "UPDATE diet.user_profiles SET profile_photo_url = :pictureUrl WHERE user_id = :userId")
                        .setParameter("pictureUrl", pictureUrl)
                        .setParameter("userId", userId)
                        .executeUpdate();

                log.info("Updated profile picture for OAuth user: {} from Google", email);
            }

            return generateAuthResponseFromOAuth(userId, email, (String) googleUser[1],
                    pictureUrl != null ? pictureUrl : (String) googleUser[2], (String) googleUser[3]);
        }

        // Check if user exists by email (email_search)
        Long existingUserId = null;
        try {
            existingUserId = ((Number) entityManager.createNativeQuery(
                    "SELECT id FROM diet.users WHERE email_search = :emailHash")
                    .setParameter("emailHash", emailHash)
                    .getSingleResult()).longValue();
        } catch (Exception e) {
            // User not found by email, will create new user
        }

        if (existingUserId != null) {
            // Link Google account to existing user - also update profile picture if provided
            String updateQuery = "UPDATE diet.users SET google_id = :googleId, email_verified = true";
            if (pictureUrl != null) {
                updateQuery += ", profile_picture_url = :pictureUrl";
            }
            updateQuery += " WHERE id = :userId";

            var nativeQuery = entityManager.createNativeQuery(updateQuery)
                    .setParameter("googleId", googleId)
                    .setParameter("userId", existingUserId);
            if (pictureUrl != null) {
                nativeQuery.setParameter("pictureUrl", pictureUrl);
            }
            nativeQuery.executeUpdate();

            // Also update profile photo in user_profiles table if picture URL is provided
            if (pictureUrl != null) {
                entityManager.createNativeQuery(
                        "UPDATE diet.user_profiles SET profile_photo_url = :pictureUrl WHERE user_id = :userId")
                        .setParameter("pictureUrl", pictureUrl)
                        .setParameter("userId", existingUserId)
                        .executeUpdate();
            }

            // Get user details
            Object[] user = (Object[]) entityManager.createNativeQuery(
                    "SELECT u.full_name, u.profile_picture_url, r.role_code " +
                    "FROM diet.users u JOIN diet.roles r ON u.role_id = r.id WHERE u.id = :userId")
                    .setParameter("userId", existingUserId)
                    .getSingleResult();

            log.info("OAuth login - linked Google account to existing user: {}", email);
            return generateAuthResponseFromOAuth(existingUserId, email, (String) user[0],
                    pictureUrl != null ? pictureUrl : (String) user[1], (String) user[2]);
        }

        // Create new user via native query
        // Get PATIENT role ID
        Long patientRoleId = ((Number) entityManager.createNativeQuery(
                "SELECT id FROM diet.roles WHERE role_code = 'PATIENT'")
                .getSingleResult()).longValue();

        // Encrypt the email using injected EncryptionUtil bean
        String encryptedEmail = encryptionUtil.encrypt(email);

        // Insert new user
        Long newUserId = ((Number) entityManager.createNativeQuery("""
                INSERT INTO diet.users (email, email_search, google_id, full_name, profile_picture_url,
                    email_verified, role_id, is_active, created_by, created_date)
                VALUES (:email, :emailHash, :googleId, :fullName, :profilePictureUrl,
                    true, :roleId, true, 'OAUTH', now())
                RETURNING id
                """)
                .setParameter("email", encryptedEmail)
                .setParameter("emailHash", emailHash)
                .setParameter("googleId", googleId)
                .setParameter("fullName", fullName)
                .setParameter("profilePictureUrl", pictureUrl)
                .setParameter("roleId", patientRoleId)
                .getSingleResult()).longValue();

        // Create user profile for new OAuth user
        entityManager.createNativeQuery("""
                INSERT INTO diet.user_profiles (user_id, first_name, profile_photo_url, created_by, created_date)
                VALUES (:userId, :firstName, :profilePhotoUrl, 'OAUTH', now())
                """)
                .setParameter("userId", newUserId)
                .setParameter("firstName", fullName != null ? fullName.split(" ")[0] : "")
                .setParameter("profilePhotoUrl", pictureUrl != null ? pictureUrl : "")
                .executeUpdate();

        log.info("OAuth login - created new user with profile: {}", email);

        // Send welcome email to new OAuth users
        try {
            emailService.sendWelcomeEmail(email, fullName);
        } catch (Exception e) {
            log.warn("Failed to send welcome email to OAuth user: {}", email, e);
        }

        return generateAuthResponseFromOAuth(newUserId, email, fullName, pictureUrl, "PATIENT");
    }

    private AuthDto.AuthResponse generateAuthResponseFromOAuth(Long userId, String email, String fullName,
            String profilePictureUrl, String roleCode) {
        // If userId is null, get it from the email
        if (userId == null) {
            String emailHash = EmailHashUtil.hash(email);
            userId = ((Number) entityManager.createNativeQuery(
                    "SELECT id FROM diet.users WHERE email_search = :emailHash")
                    .setParameter("emailHash", emailHash)
                    .getSingleResult()).longValue();
        }

        String accessToken = tokenProvider.generateToken(email);
        String refreshToken = tokenProvider.generateRefreshToken(email);

        AuthDto.UserInfo userInfo = new AuthDto.UserInfo();
        userInfo.setId(userId);
        userInfo.setEmail(email);
        userInfo.setFullName(fullName);
        userInfo.setRole(roleCode);
        userInfo.setEmailVerified(true);
        userInfo.setProfilePictureUrl(profilePictureUrl);

        return new AuthDto.AuthResponse(
                accessToken,
                refreshToken,
                86400000L,
                userInfo
        );
    }

    private String generateOtp() {
        return String.format("%06d", secureRandom.nextInt(1000000));
    }

    private AuthDto.UserInfo mapToUserInfo(User user) {
        AuthDto.UserInfo userInfo = new AuthDto.UserInfo();
        userInfo.setId(user.getId());
        userInfo.setEmail(user.getEmail());
        userInfo.setFullName(user.getFullName());
        userInfo.setRole(user.getRole().getRoleCode());
        userInfo.setEmailVerified(user.getEmailVerified());
        userInfo.setProfilePictureUrl(user.getProfilePictureUrl());
        return userInfo;
    }
}
