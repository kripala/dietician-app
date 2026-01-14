package com.dietician.model;

import com.dietician.util.StringEncryptionConverter;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * User entity representing both dieticians and patients.
 * Email is encrypted at rest using AES-256-GCM.
 * Password is hashed using BCrypt (handled by Spring Security).
 * Extends AuditableEntity for automatic audit field management.
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email"),
    @Index(name = "idx_users_google_id", columnList = "google_id"),
    @Index(name = "idx_users_role", columnList = "role_id")
})
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 500)
    @Convert(converter = StringEncryptionConverter.class)
    private String email;

    @Column(name = "email_search", nullable = false, unique = true, length = 128)
    private String emailSearch;

    @Column(length = 100)
    private String password; // BCrypt hashed, null for OAuth users

    @Column(name = "google_id", unique = true, length = 100)
    private String googleId; // Google OAuth ID

    @Column(name = "email_verified", nullable = false)
    private Boolean emailVerified = false;

    @Column(name = "otp_code", length = 10)
    private String otpCode; // Temporary OTP for email verification

    @Column(name = "otp_expiry")
    private LocalDateTime otpExpiry;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(name = "profile_picture_url", length = 500)
    private String profilePictureUrl;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
