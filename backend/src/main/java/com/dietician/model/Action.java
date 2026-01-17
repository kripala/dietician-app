package com.dietician.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Entity representing granular actions/permissions for RBAC.
 * Examples: VIEW_PATIENT, CREATE_PATIENT, DELETE_PATIENT, etc.
 */
@Entity
@Table(name = "actions", indexes = {
    @Index(name = "idx_actions_module", columnList = "module"),
    @Index(name = "idx_actions_active", columnList = "is_active")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Action extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "actions_id_seq")
    @SequenceGenerator(name = "actions_id_seq", sequenceName = "actions_id_seq", allocationSize = 1)
    private Long id;

    @Column(name = "action_code", unique = true, nullable = false, length = 50)
    private String actionCode;

    @Column(name = "action_name", nullable = false, length = 100)
    private String actionName;

    @Column(length = 255)
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "module", nullable = false, length = 50)
    private String module;
}
