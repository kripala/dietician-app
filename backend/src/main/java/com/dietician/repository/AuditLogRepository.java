package com.dietician.repository;

import com.dietician.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByTableNameAndRecordId(String tableName, Long recordId);

    List<AuditLog> findByChangedByAndChangedDateBetween(
            String changedBy,
            LocalDateTime startDate,
            LocalDateTime endDate
    );

    List<AuditLog> findByAction(String action);
}
