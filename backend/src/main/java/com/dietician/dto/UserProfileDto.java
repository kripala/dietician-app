package com.dietician.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

/**
 * DTOs for User Profile operations
 */
public class UserProfileDto {

    /**
     * Request DTO for updating user profile
     */
    @Data
    public static class UpdateProfileRequest {
        @Email(message = "Invalid email format")
        @Size(max = 255, message = "Email must not exceed 255 characters")
        private String email;

        @NotBlank(message = "First name is required")
        @Size(max = 100, message = "First name must not exceed 100 characters")
        private String firstName;

        @Size(max = 100, message = "Middle name must not exceed 100 characters")
        private String middleName;

        @NotBlank(message = "Last name is required")
        @Size(max = 100, message = "Last name must not exceed 100 characters")
        private String lastName;

        @NotNull(message = "Date of birth is required")
        @Past(message = "Date of birth must be in the past")
        private LocalDate dateOfBirth;

        @NotBlank(message = "Gender is required")
        @Pattern(regexp = "^(MALE|FEMALE|OTHER)$", message = "Gender must be MALE, FEMALE, or OTHER")
        private String gender;

        @NotBlank(message = "Country code is required")
        @Size(max = 10, message = "Country code must not exceed 10 characters")
        private String countryCode;

        @NotBlank(message = "Mobile number is required")
        @Pattern(regexp = "^[0-9]{6,15}$", message = "Invalid mobile number")
        private String mobileNumber;

        @Size(max = 100, message = "Country must not exceed 100 characters")
        private String country;

        @Size(max = 100, message = "State must not exceed 100 characters")
        private String state;

        @Size(max = 500, message = "Address must not exceed 500 characters")
        private String addressLine;

        @Size(max = 20, message = "Pincode must not exceed 20 characters")
        private String pincode;
    }

    /**
     * Response DTO for user profile
     * Includes new JWT tokens when email is updated
     */
    @Data
    public static class ProfileResponse {
        private Long id;
        private Long userId;
        private String firstName;
        private String middleName;
        private String lastName;
        private String fullName;
        private LocalDate dateOfBirth;
        private Integer age;
        private String gender;
        private String countryCode;
        private String mobileNumber;
        private String fullPhoneNumber;
        private String email;
        private String country;
        private String state;
        private String addressLine;
        private String pincode;
        private String profilePhotoUrl;
        private Boolean emailVerified;
        // New tokens when email is updated
        private String accessToken;
        private String refreshToken;
        private Boolean emailChanged;
        private Boolean forceLogout;
        private Boolean isOAuthUser;
    }

    /**
     * Response DTO for photo upload
     */
    @Data
    public static class PhotoUploadResponse {
        private String message;
        private String profilePhotoUrl;
    }

    /**
     * Generic message response
     */
    @Data
    public static class MessageResponse {
        private String message;

        public MessageResponse(String message) {
            this.message = message;
        }
    }
}
