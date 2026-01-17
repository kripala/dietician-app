package com.dietician.security;

import com.dietician.model.User;
import com.dietician.repository.RoleActionRepository;
import com.dietician.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;

/**
 * Custom PermissionEvaluator for action-based access control.
 * Checks if a user's role has a specific action permission.
 *
 * Usage in controllers: @PreAuthorize("hasPermission(#id, 'ACTION_CODE')")
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CustomPermissionEvaluator implements PermissionEvaluator {

    private final RoleActionRepository roleActionRepository;
    private final UserRepository userRepository;

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

        // Get user from database to check role
        User user = userRepository.findByEmailSearch(com.dietician.util.EmailHashUtil.hash(email)).orElse(null);

        if (user == null || !Boolean.TRUE.equals(user.getIsActive())) {
            return false;
        }

        Long roleId = user.getRole().getId();
        boolean hasPermission = roleActionRepository.existsByRoleIdAndActionActionCode(roleId, actionCode);

        log.debug("Permission check: user={}, role={}, action={}, result={}",
                email, roleId, actionCode, hasPermission);

        return hasPermission;
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
