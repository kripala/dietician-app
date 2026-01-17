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
