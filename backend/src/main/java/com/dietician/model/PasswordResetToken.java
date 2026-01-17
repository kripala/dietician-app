package com.dietician.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing password reset tokens for admin-initiated password resets.
 * When an admin resets a user's password, a temporary password is generated and emailed.
 * The user must change their password on first login.
 */
@Entity
@Table(name = "password_reset_tokens", indexes = {
    @Index(name = "idx_password_reset_user", columnList = "user_id"),
    @Index(name = "idx_password_reset_token", columnList = "token")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "password_reset_tokens_id_seq")
    @SequenceGenerator(name = "password_reset_tokens_id_seq", sequenceName = "password_reset_tokens_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = false)
    private String token;

    @Column(name = "expiry_timestamp", nullable = false)
    private LocalDateTime expiryTimestamp;

    @Column(nullable = false)
    @Builder.Default
    private Boolean used = false;

    @Column(name = "created_date", nullable = false, updatable = false)
    private LocalDateTime createdDate = LocalDateTime.now();
}
