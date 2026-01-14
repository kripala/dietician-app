package com.dietician.service;

import com.dietician.model.AuditLog;
import com.dietician.model.AuditLogDetail;
import com.dietician.repository.AuditLogRepository;
import com.dietician.repository.AuditLogDetailRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Service for managing audit logs
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final AuditLogDetailRepository auditLogDetailsRepository;

    /**
     * Create an audit log entry
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog createAuditLog(
            String tableName,
            Long recordId,
            String action,
            String username,
            Map<String, Object> changes) {

        try {
            HttpServletRequest request = getCurrentRequest();
            String ipAddress = getClientIpAddress(request);
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            AuditLog auditLog = AuditLog.builder()
                    .tableName(tableName)
                    .recordId(recordId)
                    .action(action)
                    .changedBy(username)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();

            final AuditLog savedAuditLog = auditLogRepository.save(auditLog);

            // Add details if changes provided
            if (changes != null && !changes.isEmpty()) {
                List<AuditLogDetail> detailList = new ArrayList<>();
                changes.forEach((field, value) -> {
                    String valueStr = value != null ? value.toString() : null;
                    AuditLogDetail detail = AuditLogDetail.builder()
                            .auditLog(savedAuditLog)
                            .fieldName(field)
                            .oldValue(null)
                            .newValue(valueStr)
                            .build();
                    detailList.add(detail);
                });
                auditLogDetailsRepository.saveAll(detailList);
            }

            log.info("Audit log created: {} {} {} by {}", action, tableName, recordId, username);
            return savedAuditLog;

        } catch (Exception e) {
            log.error("Failed to create audit log", e);
            // Don't throw - audit logging failures shouldn't break the main operation
            return null;
        }
    }

    /**
     * Create an audit log entry with old and new values
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog createAuditLogWithChanges(
            String tableName,
            Long recordId,
            String action,
            String username,
            Map<String, Object> oldValues,
            Map<String, Object> newValues) {

        try {
            HttpServletRequest request = getCurrentRequest();
            String ipAddress = getClientIpAddress(request);
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            AuditLog auditLog = AuditLog.builder()
                    .tableName(tableName)
                    .recordId(recordId)
                    .action(action)
                    .changedBy(username)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();

            final AuditLog savedAuditLog = auditLogRepository.save(auditLog);

            // Add field-level details
            if (newValues != null) {
                List<AuditLogDetail> detailList = new ArrayList<>();
                newValues.forEach((field, newValue) -> {
                    Object oldValueObj = oldValues != null ? oldValues.get(field) : null;
                    String oldValueStr = oldValueObj != null ? oldValueObj.toString() : null;
                    String oldValueFinal = oldValueStr != null ? oldValueStr : "";

                    String newValueStr = newValue != null ? newValue.toString() : "";
                    String newValueFinal = !newValueStr.isEmpty() ? newValueStr : null;

                    AuditLogDetail detail = AuditLogDetail.builder()
                            .auditLog(savedAuditLog)
                            .fieldName(field)
                            .oldValue(oldValueFinal)
                            .newValue(newValueFinal)
                            .build();
                    detailList.add(detail);
                });
                auditLogDetailsRepository.saveAll(detailList);
            }

            log.info("Audit log created: {} {} {} by {}", action, tableName, recordId, username);
            return savedAuditLog;

        } catch (Exception e) {
            log.error("Failed to create audit log", e);
            return null;
        }
    }

    /**
     * Get current HTTP request
     */
    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }

    /**
     * Get client IP address from request
     */
    private String getClientIpAddress(HttpServletRequest request) {
        if (request == null) {
            return "SYSTEM";
        }

        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
