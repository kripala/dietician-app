package com.dietician.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity representing detailed field-level changes for audit logs
 */
@Entity
@Table(name = "audit_log_details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @SequenceGenerator(name = "audit_log_details_id_seq", sequenceName = "audit_log_details_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_log_id", nullable = false)
    private AuditLog auditLog;

    @Column(name = "field_name", nullable = false, length = 50)
    private String fieldName;

    @Column(name = "old_value", columnDefinition = "text")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "text")
    private String newValue;
}
