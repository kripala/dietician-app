package com.dietician.repository;

import com.dietician.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for PasswordResetToken entity.
 */
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    /**
     * Find a valid (unused and not expired) reset token.
     */
    Optional<PasswordResetToken> findByTokenAndUsedFalseAndExpiryTimestampAfter(
            String token, LocalDateTime now);

    /**
     * Find all reset tokens for a user.
     */
    List<PasswordResetToken> findByUserIdOrderByCreatedDateDesc(Long userId);

    /**
     * Delete all tokens for a specific user.
     */
    void deleteByUserId(Long userId);
}
