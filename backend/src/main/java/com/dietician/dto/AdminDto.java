package com.dietician.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Data Transfer Objects for Admin operations.
 * Contains DTOs for user management, role management, and action permissions.
 */
public class AdminDto {

    /**
     * Summary representation of a user for admin lists.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String email;
        private String fullName;
        private String roleCode;
        private String roleName;
        private Boolean isActive;
        private Boolean emailVerified;
        private LocalDateTime createdDate;
    }

    /**
     * Detailed user response for admin view.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserResponse {
        private Long id;
        private String email;
        private String fullName;
        private RoleInfo role;
        private Boolean isActive;
        private Boolean emailVerified;
        private String profilePictureUrl;
        private LocalDateTime createdDate;
        private List<String> actions;
    }

    /**
     * Role information.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleInfo {
        private Long id;
        private String roleCode;
        private String roleName;
    }

    /**
     * Request to create a new user.
     */
    @Data
    @NoArgsConstructor
    public static class CreateUserRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        private String email;

        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
        private String fullName;

        @NotBlank(message = "Role is required")
        @Pattern(regexp = "PATIENT|DIETICIAN|ADMIN", message = "Role must be PATIENT, DIETICIAN, or ADMIN")
        private String role;

        private String password; // Optional - if not provided, temp password will be generated
    }

    /**
     * Request to update a user.
     */
    @Data
    @NoArgsConstructor
    public static class UpdateUserRequest {
        private String fullName;

        @Email(message = "Email must be valid")
        private String email;

        private String role; // Role code to change
    }

    /**
     * Response for action list.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActionResponse {
        private Long id;
        private String actionCode;
        private String actionName;
        private String description;
        private String module;
        private Boolean isActive;
        private Boolean assigned; // Whether this action is assigned to the role
    }

    /**
     * Request to update role actions.
     */
    @Data
    @NoArgsConstructor
    public static class UpdateRoleActionsRequest {
        private List<Long> actionIds;
    }

    /**
     * Paginated user list response.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserListResponse {
        private List<UserSummary> users;
        private int currentPage;
        private int totalPages;
        private long totalElements;
        private int pageSize;
    }

    /**
     * Response with user actions.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserActionsResponse {
        private Long userId;
        private String email;
        private String roleCode;
        private List<String> actions;
    }

    /**
     * Response for role list - used for dynamic role rendering in frontend.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleResponse {
        private Long id;
        private String roleCode;
        private String roleName;
    }
}
