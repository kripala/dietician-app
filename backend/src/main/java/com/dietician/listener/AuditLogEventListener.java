package com.dietician.listener;

import com.dietician.model.AuditableEntity;
import com.dietician.model.User;
import com.dietician.service.AuditLogService;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Hibernate event listener for automatic audit logging
 * Captures INSERT, UPDATE, and DELETE operations on entities extending AuditableEntity
 */
@Slf4j
@Component
public class AuditLogEventListener {

    private final AuditLogService auditLogService;

    public AuditLogEventListener(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @PostPersist
    public void onPostInsert(Object entity) {
        if (!(entity instanceof AuditableEntity)) {
            return;
        }

        try {
            AuditableEntity auditable = (AuditableEntity) entity;
            String tableName = getTableName(entity);
            Long recordId = getRecordId(auditable);
            String username = getCurrentUsername();

            log.debug("PostPersist: {} {} by {}", tableName, recordId, username);
            auditLogService.createAuditLog(tableName, recordId, "INSERT", username, null);
        } catch (Exception e) {
            log.error("Failed to create INSERT audit log", e);
        }
    }

    @PostUpdate
    public void onPostUpdate(Object entity) {
        if (!(entity instanceof AuditableEntity)) {
            return;
        }

        try {
            AuditableEntity auditable = (AuditableEntity) entity;
            String tableName = getTableName(entity);
            Long recordId = getRecordId(auditable);
            String username = getCurrentUsername();

            log.debug("PostUpdate: {} {} by {}", tableName, recordId, username);
            auditLogService.createAuditLog(tableName, recordId, "UPDATE", username, null);
        } catch (Exception e) {
            log.error("Failed to create UPDATE audit log", e);
        }
    }

    @PostRemove
    public void onPostRemove(Object entity) {
        if (!(entity instanceof AuditableEntity)) {
            return;
        }

        try {
            AuditableEntity auditable = (AuditableEntity) entity;
            String tableName = getTableName(entity);
            Long recordId = getRecordId(auditable);
            String username = getCurrentUsername();

            log.debug("PostRemove: {} {} by {}", tableName, recordId, username);
            auditLogService.createAuditLog(tableName, recordId, "DELETE", username, null);
        } catch (Exception e) {
            log.error("Failed to create DELETE audit log", e);
        }
    }

    /**
     * Get table name from entity class
     */
    private String getTableName(Object entity) {
        jakarta.persistence.Table tableAnnotation = entity.getClass()
                .getAnnotation(jakarta.persistence.Table.class);
        if (tableAnnotation != null && !tableAnnotation.name().isEmpty()) {
            return tableAnnotation.name();
        }
        return entity.getClass().getSimpleName().toLowerCase();
    }

    /**
     * Get record ID from entity
     */
    private Long getRecordId(AuditableEntity entity) {
        // Use reflection to get the ID field
        try {
            java.lang.reflect.Field idField = findIdField(entity.getClass());
            if (idField != null) {
                idField.setAccessible(true);
                Object idValue = idField.get(entity);
                if (idValue instanceof Long) {
                    return (Long) idValue;
                } else if (idValue instanceof Integer) {
                    return ((Integer) idValue).longValue();
                }
            }
        } catch (Exception e) {
            log.error("Failed to extract ID from entity", e);
        }
        return null;
    }

    /**
     * Find the ID field in the entity class hierarchy
     */
    private java.lang.reflect.Field findIdField(Class<?> clazz) {
        while (clazz != null && clazz != Object.class) {
            for (java.lang.reflect.Field field : clazz.getDeclaredFields()) {
                if (field.isAnnotationPresent(jakarta.persistence.Id.class)) {
                    return field;
                }
            }
            clazz = clazz.getSuperclass();
        }
        return null;
    }

    /**
     * Get current username from security context
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof User) {
                User user = (User) principal;
                return user.getEmail();
            } else if (principal instanceof String) {
                return (String) principal;
            }
            return principal.toString();
        }
        return "SYSTEM";
    }
}
