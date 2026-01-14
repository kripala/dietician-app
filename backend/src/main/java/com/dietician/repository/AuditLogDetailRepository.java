package com.dietician.repository;

import com.dietician.model.AuditLogDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogDetailRepository extends JpaRepository<AuditLogDetail, Long> {
}
