package com.dietician.controller;

import com.dietician.dto.AdminDto.*;
import com.dietician.dto.AuthDto.MessageResponse;
import com.dietician.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API controller for admin operations.
 * All endpoints require specific action permissions.
 */
@Slf4j
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ============================================
    // USER MANAGEMENT ENDPOINTS
    // ============================================

    /**
     * Get paginated list of users by role.
     * Requires: VIEW_PATIENT or VIEW_DIETICIAN action
     */
    @GetMapping("/users")
    @PreAuthorize("hasPermission(null, 'VIEW_PATIENT') or hasPermission(null, 'VIEW_DIETICIAN')")
    public ResponseEntity<Page<UserSummary>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("GET /admin/users - role: {}, page: {}, size: {}", role, page, size);
        return ResponseEntity.ok(adminService.getUsers(role, page, size));
    }

    /**
     * Get user details by ID.
     */
    @GetMapping("/users/{id}")
    @PreAuthorize("hasPermission(null, 'VIEW_PATIENT') or hasPermission(null, 'VIEW_DIETICIAN')")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        log.info("GET /admin/users/{}", id);
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    /**
     * Create a new user.
     * Requires: CREATE_PATIENT or CREATE_DIETICIAN action
     */
    @PostMapping("/users")
    @PreAuthorize("hasPermission(null, 'CREATE_PATIENT') or hasPermission(null, 'CREATE_DIETICIAN')")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        log.info("POST /admin/users - email: {}, role: {}", request.getEmail(), request.getRole());
        UserResponse response = adminService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update user details.
     * Requires: EDIT_PATIENT or EDIT_DIETICIAN action
     */
    @PutMapping("/users/{id}")
    @PreAuthorize("hasPermission(null, 'EDIT_PATIENT') or hasPermission(null, 'EDIT_DIETICIAN')")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        log.info("PUT /admin/users/{}", id);
        return ResponseEntity.ok(adminService.updateUser(id, request));
    }

    /**
     * Activate or deactivate a user.
     * Requires: ACTIVATE_PATIENT, DEACTIVATE_PATIENT, ACTIVATE_DIETICIAN, or DEACTIVATE_DIETICIAN action
     */
    @PatchMapping("/users/{id}/status")
    @PreAuthorize("hasPermission(null, 'ACTIVATE_PATIENT') or hasPermission(null, 'DEACTIVATE_PATIENT') or " +
            "hasPermission(null, 'ACTIVATE_DIETICIAN') or hasPermission(null, 'DEACTIVATE_DIETICIAN')")
    public ResponseEntity<MessageResponse> setUserStatus(
            @PathVariable Long id,
            @RequestParam Boolean active) {
        log.info("{} user with id: {}", active ? "Activating" : "Deactivating", id);
        return ResponseEntity.ok(adminService.setUserStatus(id, active));
    }

    /**
     * Reset user password (sends email with temporary password).
     * Requires: RESET_PATIENT_PASSWORD or RESET_DIETICIAN_PASSWORD action
     */
    @PostMapping("/users/{id}/reset-password")
    @PreAuthorize("hasPermission(null, 'RESET_PATIENT_PASSWORD') or hasPermission(null, 'RESET_DIETICIAN_PASSWORD')")
    public ResponseEntity<MessageResponse> resetPassword(@PathVariable Long id) {
        log.info("POST /admin/users/{}/reset-password", id);
        return ResponseEntity.ok(adminService.resetUserPassword(id));
    }

    // ============================================
    // ROLE & ACTION MANAGEMENT ENDPOINTS
    // ============================================

    /**
     * Get all actions for a specific role.
     * Requires: MANAGE_ROLES action
     */
    @GetMapping("/roles/{roleId}/actions")
    @PreAuthorize("hasPermission(null, 'MANAGE_ROLES')")
    public ResponseEntity<List<ActionResponse>> getRoleActions(@PathVariable Long roleId) {
        log.info("GET /admin/roles/{}/actions", roleId);
        return ResponseEntity.ok(adminService.getRoleActions(roleId));
    }

    /**
     * Update actions for a specific role.
     * Requires: MANAGE_ROLES action
     */
    @PutMapping("/roles/{roleId}/actions")
    @PreAuthorize("hasPermission(null, 'MANAGE_ROLES')")
    public ResponseEntity<MessageResponse> updateRoleActions(
            @PathVariable Long roleId,
            @RequestBody UpdateRoleActionsRequest request) {
        log.info("PUT /admin/roles/{}/actions", roleId);
        return ResponseEntity.ok(adminService.updateRoleActions(roleId, request.getActionIds()));
    }

    /**
     * Get all available actions.
     * Requires: MANAGE_ROLES action
     */
    @GetMapping("/actions")
    @PreAuthorize("hasPermission(null, 'MANAGE_ROLES')")
    public ResponseEntity<List<ActionResponse>> getAllActions() {
        log.info("GET /admin/actions");
        return ResponseEntity.ok(adminService.getAllActions());
    }

    /**
     * Get actions for the current user.
     */
    @GetMapping("/me/actions")
    public ResponseEntity<UserActionsResponse> getMyActions() {
        // This will be implemented to get current user's actions from JWT
        // For now, return a placeholder
        return ResponseEntity.ok(
                UserActionsResponse.builder()
                        .userId(0L)
                        .email("")
                        .roleCode("")
                        .actions(List.of())
                        .build()
        );
    }
}
