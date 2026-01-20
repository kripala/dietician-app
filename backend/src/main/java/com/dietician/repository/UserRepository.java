package com.dietician.repository;

import com.dietician.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
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

    // ============================================
    // Native queries to avoid encrypted email field
    // These are needed when existing encrypted data
    // cannot be decrypted with current key
    // ============================================

    /**
     * Find user ID by email search (avoids encrypted email field).
     */
    @Query(value = "SELECT id FROM diet.users WHERE email_search = :emailSearch", nativeQuery = true)
    Optional<Long> findIdByEmailSearch(@Param("emailSearch") String emailSearch);

    /**
     * Check if user exists by email search (returns boolean, avoids User entity).
     */
    @Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM diet.users WHERE email_search = :emailSearch", nativeQuery = true)
    boolean existsByEmailSearchNative(@Param("emailSearch") String emailSearch);

    // ============================================
    // Admin / RBAC Queries
    // ============================================

    /**
     * Find users by role ID with pagination.
     */
    @Query("SELECT u FROM User u WHERE u.role.id = :roleId AND (:isActive IS NULL OR u.isActive = :isActive)")
    Page<User> findByRoleIdAndIsActive(@Param("roleId") Long roleId, @Param("isActive") Boolean isActive, Pageable pageable);

    /**
     * Find users by role codes (e.g., PATIENT, DIETICIAN) with optional active filter.
     */
    @Query("SELECT u FROM User u WHERE u.role.roleCode IN :roleCodes AND (:isActive IS NULL OR u.isActive = :isActive)")
    Page<User> findByRoleCodesAndIsActive(@Param("roleCodes") List<String> roleCodes, @Param("isActive") Boolean isActive, Pageable pageable);

    /**
     * Find users by role code.
     */
    List<User> findByRoleRoleCode(String roleCode);
}
