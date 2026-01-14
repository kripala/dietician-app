package com.dietician.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Source;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing audit logs for tracking all data changes
 */
@Entity
@Table(name = "audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @SequenceGenerator(name = "audit_logs_id_seq", sequenceName = "audit_logs_id_seq", allocationSize = 1)
    private Long id;

    @Column(name = "table_name", nullable = false, length = 50)
    private String tableName;

    @Column(name = "record_id", nullable = false)
    private Long recordId;

    @Column(name = "action", nullable = false, length = 20)
    private String action;

    @CreatedBy
    @Column(name = "changed_by", nullable = false, length = 100)
    private String changedBy;

    @CreatedDate
    @Column(name = "changed_date", nullable = false)
    private LocalDateTime changedDate;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @OneToMany(mappedBy = "auditLog", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AuditLogDetail> details = new ArrayList<>();
}
