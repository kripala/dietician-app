package com.dietician.repository;

import com.dietician.model.Action;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Action entity.
 */
@Repository
public interface ActionRepository extends JpaRepository<Action, Long> {

    /**
     * Find action by action code.
     */
    Optional<Action> findByActionCode(String actionCode);

    /**
     * Find all actions for a specific module.
     */
    List<Action> findByModuleAndIsActiveOrderByActionName(String module, Boolean isActive);

    /**
     * Find all active actions.
     */
    List<Action> findByIsActiveTrueOrderByModuleAscActionNameAsc();
}
