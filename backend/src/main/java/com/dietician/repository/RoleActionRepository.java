package com.dietician.repository;

import com.dietician.model.Action;
import com.dietician.model.RoleAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for RoleAction entity.
 */
@Repository
public interface RoleActionRepository extends JpaRepository<RoleAction, Long> {

    /**
     * Find all actions for a specific role.
     */
    @Query("SELECT ra.action FROM RoleAction ra WHERE ra.role.id = :roleId AND ra.action.isActive = true")
    List<Action> findActionsByRoleId(@Param("roleId") Long roleId);

    /**
     * Check if a role has a specific action.
     */
    @Query("SELECT COUNT(ra) > 0 FROM RoleAction ra WHERE ra.role.id = :roleId AND ra.action.actionCode = :actionCode")
    boolean existsByRoleIdAndActionActionCode(@Param("roleId") Long roleId, @Param("actionCode") String actionCode);

    /**
     * Delete all role actions for a specific role.
     */
    void deleteByRoleId(Long roleId);

    /**
     * Find all role actions for a role.
     */
    List<RoleAction> findByRoleId(Long roleId);
}
