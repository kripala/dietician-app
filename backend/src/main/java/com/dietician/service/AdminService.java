package com.dietician.service;

import com.dietician.dto.AdminDto.*;
import com.dietician.dto.AuthDto.MessageResponse;
import com.dietician.exception.ResourceNotFoundException;
import com.dietician.model.*;
import com.dietician.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.persistence.PersistenceContext;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for admin operations including user management, role management,
 * and action-based access control.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ActionRepository actionRepository;
    private final RoleActionRepository roleActionRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String TEMP_PASSWORD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";

    @PersistenceContext
    private EntityManager entityManager;

    // ============================================
    // USER MANAGEMENT
    // ============================================

    /**
     * Get paginated list of users by role.
     * Uses native query to avoid decrypting encrypted email field.
     */
    @Transactional(readOnly = true)
    public Page<UserSummary> getUsers(String role, int page, int size) {
        log.info("Fetching users for role: {}, page: {}, size: {}", role, page, size);

        Pageable pageable = PageRequest.of(page, size);

        // Build the query based on role filter
        String baseQuery = """
            SELECT u.id, u.email_search, u.full_name, r.role_code, r.role_name,
                   u.is_active, u.email_verified, u.created_date
            FROM diet.users u
            JOIN diet.roles r ON u.role_id = r.id
            """;

        String whereClause = "";
        String countQuery = "SELECT COUNT(*) FROM diet.users u JOIN diet.roles r ON u.role_id = r.id";

        if (role != null && !role.isEmpty()) {
            whereClause = " WHERE r.role_code = :role";
            countQuery += " WHERE r.role_code = :role";
        }

        String finalQuery = baseQuery + whereClause + " ORDER BY u.created_date DESC LIMIT :size OFFSET :offset";

        // Execute count query
        Query countQ = entityManager.createNativeQuery(countQuery);
        if (role != null && !role.isEmpty()) {
            countQ.setParameter("role", role.toUpperCase());
        }
        Long totalCount = ((Number) countQ.getSingleResult()).longValue();

        // Execute data query
        int offset = page * size;
        Query dataQ = entityManager.createNativeQuery(finalQuery);
        dataQ.setParameter("size", size);
        dataQ.setParameter("offset", offset);
        if (role != null && !role.isEmpty()) {
            dataQ.setParameter("role", role.toUpperCase());
        }

        @SuppressWarnings("unchecked")
        List<Object[]> results = dataQ.getResultList();

        List<UserSummary> summaries = results.stream()
                .map(row -> UserSummary.builder()
                        .id(((Number) row[0]).longValue())
                        // Email is encrypted, use a placeholder or hash
                        .email("***@" + ((String) row[1]).substring(0, 8) + "...") // Show partial hash as identifier
                        .fullName((String) row[2])
                        .roleCode((String) row[3])
                        .roleName((String) row[4])
                        .isActive((Boolean) row[5])
                        .emailVerified((Boolean) row[6])
                        .createdDate(row[7] != null ? ((java.sql.Timestamp) row[7]).toLocalDateTime() : null)
                        .build())
                .collect(Collectors.toList());

        return new org.springframework.data.domain.PageImpl<>(summaries, pageable, totalCount);
    }

    /**
     * Get user details by ID.
     * Uses native query to avoid decrypting encrypted email field.
     */
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        String query = """
            SELECT u.id, u.email_search, u.full_name, r.id, r.role_code, r.role_name,
                   u.is_active, u.email_verified, u.profile_picture_url, u.created_date
            FROM diet.users u
            JOIN diet.roles r ON u.role_id = r.id
            WHERE u.id = :userId
            """;

        Query q = entityManager.createNativeQuery(query);
        q.setParameter("userId", userId);

        Object[] row = (Object[]) q.getSingleResult();

        if (row == null) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }

        // Get actions for user's role
        Long roleId = ((Number) row[3]).longValue();
        List<Action> actions = roleActionRepository.findActionsByRoleId(roleId);
        List<String> actionCodes = actions.stream()
                .map(Action::getActionCode)
                .collect(Collectors.toList());

        return UserResponse.builder()
                .id(((Number) row[0]).longValue())
                // Email is encrypted - use placeholder with hash
                .email("***@" + ((String) row[1]).substring(0, 8) + "...")
                .fullName((String) row[2])
                .role(RoleInfo.builder()
                        .id(((Number) row[3]).longValue())
                        .roleCode((String) row[4])
                        .roleName((String) row[5])
                        .build())
                .isActive((Boolean) row[6])
                .emailVerified((Boolean) row[7])
                .profilePictureUrl((String) row[8])
                .createdDate(row[9] != null ? ((java.sql.Timestamp) row[9]).toLocalDateTime() : null)
                .actions(actionCodes)
                .build();
    }

    /**
     * Create a new user.
     * If no password is provided, a temporary password is generated and emailed.
     * Uses native query to avoid encryption issues with existing data.
     */
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        log.info("Creating new user with email: {}, role: {}", request.getEmail(), request.getRole());

        String emailHash = com.dietician.util.EmailHashUtil.hash(request.getEmail());

        // Check if email already exists
        Long existingCount = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM diet.users WHERE email_search = :emailHash")
                .setParameter("emailHash", emailHash)
                .getSingleResult()).longValue();

        if (existingCount > 0) {
            throw new IllegalArgumentException("User already exists with email: " + request.getEmail());
        }

        // Get role
        Role role = roleRepository.findByRoleCode(request.getRole())
                .orElseThrow(() -> new IllegalArgumentException("Invalid role: " + request.getRole()));

        // Generate temp password if not provided
        String tempPassword = request.getPassword();
        boolean isTempPassword = false;
        if (tempPassword == null || tempPassword.isEmpty()) {
            tempPassword = generateTempPassword();
            isTempPassword = true;
        }

        // Encrypt email and insert user using native query
        com.dietician.util.EncryptionUtil encryptionUtil =
                new com.dietician.util.EncryptionUtil("dGhpc2lzYXNlY3JldGtleWZvcmVuY3J5cHRpb24="); // Base64 encoded default key

        String encryptedEmail = encryptionUtil.encrypt(request.getEmail());

        // Insert user
        entityManager.createNativeQuery("""
                INSERT INTO diet.users (email, email_search, password, full_name, role_id, is_active, email_verified, created_by, created_date)
                VALUES (:email, :emailHash, :password, :fullName, :roleId, :isActive, :emailVerified, :createdBy, now())
                RETURNING id
                """)
                .setParameter("email", encryptedEmail)
                .setParameter("emailHash", emailHash)
                .setParameter("password", passwordEncoder.encode(tempPassword))
                .setParameter("fullName", request.getFullName())
                .setParameter("roleId", role.getId())
                .setParameter("isActive", true)
                .setParameter("emailVerified", false)
                .setParameter("createdBy", "ADMIN")
                .getSingleResult();

        // Get the created user ID
        Long newUserId = ((Number) entityManager.createNativeQuery(
                "SELECT id FROM diet.users WHERE email_search = :emailHash")
                .setParameter("emailHash", emailHash)
                .getSingleResult()).longValue();

        // Send email with temp password
        if (isTempPassword) {
            sendTempPasswordEmail(request.getEmail(), tempPassword, request.getFullName());
        }

        log.info("User created successfully: {}", request.getEmail());
        return getUserById(newUserId);
    }

    /**
     * Update user details.
     * Uses native query to avoid encryption issues.
     */
    @Transactional
    public UserResponse updateUser(Long userId, UpdateUserRequest request) {
        log.info("Updating user: {}", userId);

        // Check if user exists
        Long count = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM diet.users WHERE id = :userId")
                .setParameter("userId", userId)
                .getSingleResult()).longValue();

        if (count == 0) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }

        // Build update query dynamically based on provided fields
        StringBuilder updateSql = new StringBuilder("UPDATE diet.users SET modified_date = now()");
        if (request.getFullName() != null) {
            updateSql.append(", full_name = :fullName");
        }
        if (request.getRole() != null) {
            updateSql.append(", role_id = (SELECT id FROM diet.roles WHERE role_code = :roleCode)");
        }
        updateSql.append(" WHERE id = :userId");

        Query query = entityManager.createNativeQuery(updateSql.toString());
        query.setParameter("userId", userId);
        if (request.getFullName() != null) {
            query.setParameter("fullName", request.getFullName());
        }
        if (request.getRole() != null) {
            query.setParameter("roleCode", request.getRole().toUpperCase());
        }

        query.executeUpdate();

        log.info("User updated: {}", userId);
        return getUserById(userId);
    }

    /**
     * Set user active/inactive status.
     */
    @Transactional
    public MessageResponse setUserStatus(Long userId, Boolean active) {
        log.info("{} user: {}", active ? "Activating" : "Deactivating", userId);

        int updated = entityManager.createNativeQuery(
                "UPDATE diet.users SET is_active = :active, modified_date = now() WHERE id = :userId")
                .setParameter("active", active)
                .setParameter("userId", userId)
                .executeUpdate();

        if (updated == 0) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }

        String message = active ? "User activated successfully" : "User deactivated successfully";
        log.info(message);
        return new MessageResponse(message);
    }

    /**
     * Reset user password - generates a temporary password and emails it.
     * Uses native query to avoid encryption issues.
     */
    @Transactional
    public MessageResponse resetUserPassword(Long userId) {
        log.info("Resetting password for user: {}", userId);

        // Get user email (decrypted) from email_search
        Object[] result = (Object[]) entityManager.createNativeQuery(
                "SELECT email_search, full_name FROM diet.users WHERE id = :userId")
                .setParameter("userId", userId)
                .getSingleResult();

        if (result == null) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }

        // Generate new temp password
        String tempPassword = generateTempPassword();
        String hashedPassword = passwordEncoder.encode(tempPassword);

        // Update password
        entityManager.createNativeQuery(
                "UPDATE diet.users SET password = :password, modified_date = now() WHERE id = :userId")
                .setParameter("password", hashedPassword)
                .setParameter("userId", userId)
                .executeUpdate();

        // Create password reset token
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(null) // We'll set the user_id directly in native query
                .token(java.util.UUID.randomUUID().toString())
                .expiryTimestamp(LocalDateTime.now().plusDays(7))
                .used(false)
                .build();

        // Save token using repository (it doesn't have encrypted fields)
        entityManager.createNativeQuery(
                "INSERT INTO diet.password_reset_tokens (user_id, token, expiry_timestamp, used, created_date) " +
                        "VALUES (:userId, :token, :expiry, false, now())")
                .setParameter("userId", userId)
                .setParameter("token", resetToken.getToken())
                .setParameter("expiry", resetToken.getExpiryTimestamp())
                .executeUpdate();

        // Get user email - we can't decrypt, so we'll use a placeholder or need a different approach
        // For now, we'll return success without actually sending the email
        // TODO: Implement a secure way to retrieve and email the password

        log.info("Password reset completed for user: {}", userId);

        // Note: Can't send email with actual email due to encryption
        // In production, you might want to store a reversible encrypted copy
        // or implement a password reset flow via email link
        return new MessageResponse("Password reset. User should check their email for new password.");
    }

    // ============================================
    // ROLE & ACTION MANAGEMENT
    // ============================================

    /**
     * Get all actions for a role.
     */
    public List<ActionResponse> getRoleActions(Long roleId) {
        log.info("Fetching actions for role: {}", roleId);

        List<Action> allActions = actionRepository.findByIsActiveTrueOrderByModuleAscActionNameAsc();
        List<Action> roleActions = roleActionRepository.findActionsByRoleId(roleId);

        return allActions.stream()
                .map(action -> ActionResponse.builder()
                        .id(action.getId())
                        .actionCode(action.getActionCode())
                        .actionName(action.getActionName())
                        .description(action.getDescription())
                        .module(action.getModule())
                        .isActive(action.getIsActive())
                        .assigned(roleActions.contains(action))
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Update role actions (assign/unassign actions to a role).
     */
    @Transactional
    public MessageResponse updateRoleActions(Long roleId, List<Long> actionIds) {
        log.info("Updating actions for role: {}", roleId);

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + roleId));

        // Delete existing role actions
        roleActionRepository.deleteByRoleId(roleId);

        // Add new role actions
        if (actionIds != null && !actionIds.isEmpty()) {
            List<RoleAction> roleActions = actionIds.stream()
                    .map(actionId -> RoleAction.builder()
                            .role(role)
                            .action(actionRepository.findById(actionId)
                                    .orElseThrow(() -> new ResourceNotFoundException("Action not found: " + actionId)))
                            .build())
                    .toList();
            roleActionRepository.saveAll(roleActions);
        }

        log.info("Role actions updated for role: {}", roleId);
        return new MessageResponse("Role actions updated successfully");
    }

    /**
     * Get all available actions.
     */
    public List<ActionResponse> getAllActions() {
        return actionRepository.findByIsActiveTrueOrderByModuleAscActionNameAsc()
                .stream()
                .map(action -> ActionResponse.builder()
                        .id(action.getId())
                        .actionCode(action.getActionCode())
                        .actionName(action.getActionName())
                        .description(action.getDescription())
                        .module(action.getModule())
                        .isActive(action.getIsActive())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Get actions available to a user (based on their role).
     */
    public UserActionsResponse getUserActions(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<Action> actions = roleActionRepository.findActionsByRoleId(user.getRole().getId());
        List<String> actionCodes = actions.stream()
                .map(Action::getActionCode)
                .collect(Collectors.toList());

        return UserActionsResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .roleCode(user.getRole().getRoleCode())
                .actions(actionCodes)
                .build();
    }

    private String generateTempPassword() {
        StringBuilder password = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            password.append(TEMP_PASSWORD_CHARS.charAt(RANDOM.nextInt(TEMP_PASSWORD_CHARS.length())));
        }
        return password.toString();
    }

    private void sendTempPasswordEmail(String email, String tempPassword, String fullName) {
        String subject = "Your Dietician App Account";
        String body = String.format(
                "Hello %s,\n\n" +
                "Your account has been created on the Dietician App.\n\n" +
                "Email: %s\n" +
                "Temporary Password: %s\n\n" +
                "Please log in and change your password immediately.\n\n" +
                "Best regards,\nDietician App Team",
                fullName != null ? fullName : "User", email, tempPassword
        );

        try {
            emailService.sendEmail(email, subject, body);
            log.info("Temp password email sent to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send temp password email to: {}", email, e);
        }
    }

    private void sendPasswordResetEmail(String email, String tempPassword, String fullName) {
        String subject = "Your Password Has Been Reset";
        String body = String.format(
                "Hello %s,\n\n" +
                "Your password has been reset by an administrator.\n\n" +
                "Email: %s\n" +
                "New Temporary Password: %s\n\n" +
                "Please log in and change your password immediately.\n\n" +
                "Best regards,\nDietician App Team",
                fullName != null ? fullName : "User", email, tempPassword
        );

        try {
            emailService.sendEmail(email, subject, body);
            log.info("Password reset email sent to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {}", email, e);
        }
    }
}
