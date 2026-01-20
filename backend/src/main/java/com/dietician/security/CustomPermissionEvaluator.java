package com.dietician.security;

import com.dietician.util.EmailHashUtil;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;

/**
 * Custom PermissionEvaluator for action-based access control.
 * Checks if a user's role has a specific action permission.
 * Uses native queries to avoid encrypted email field issues.
 *
 * Usage in controllers: @PreAuthorize("hasPermission(#id, 'ACTION_CODE')")
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CustomPermissionEvaluator implements PermissionEvaluator {

    private final EntityManager entityManager;

    /**
     * Check if the authenticated user has a specific action permission.
     *
     * @param authentication the current user authentication
     * @param targetId unused (can be user ID for future use)
     * @param permission the action code to check (e.g., "VIEW_PATIENT")
     * @return true if user has the action, false otherwise
     */
    @Override
    public boolean hasPermission(Authentication authentication, Object targetId, Object permission) {
        String email = authentication.getName();
        String actionCode = permission.toString();

        // Use native query to check if user's role has the action
        // This avoids loading the User entity with encrypted email
        String query = """
            SELECT CASE WHEN COUNT(ra) > 0 THEN true ELSE false END
            FROM diet.role_actions ra
            JOIN diet.users u ON u.role_id = ra.role_id
            WHERE u.email_search = :emailHash
            AND ra.action_id = (SELECT id FROM diet.actions WHERE action_code = :actionCode)
            AND u.is_active = true
            """;

        Boolean hasPermission = (Boolean) entityManager.createNativeQuery(query)
                .setParameter("emailHash", EmailHashUtil.hash(email))
                .setParameter("actionCode", actionCode)
                .getSingleResult();

        log.debug("Permission check: user={}, action={}, result={}", email, actionCode, hasPermission);

        return Boolean.TRUE.equals(hasPermission);
    }

    /**
     * Check permission with a typed permission identifier.
     * Not currently used but required by interface.
     */
    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        // Delegate to the simpler hasPermission method
        return hasPermission(authentication, targetId, permission);
    }
}
