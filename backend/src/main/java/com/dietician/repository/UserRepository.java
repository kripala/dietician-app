package com.dietician.repository;

import com.dietician.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for User entity operations.
 * Note: Email queries work on encrypted data - exact match only.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailSearch(String emailSearch);

    Optional<User> findByGoogleId(String googleId);

    boolean existsByEmail(String email);

    boolean existsByEmailSearch(String emailSearch);

    boolean existsByGoogleId(String googleId);
}
