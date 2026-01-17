package com.dietician.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Entity representing the mapping between roles and actions.
 * Defines which actions (permissions) are available to each role.
 */
@Entity
@Table(name = "role_actions",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_role_action", columnNames = {"role_id", "action_id"})
    },
    indexes = {
        @Index(name = "idx_role_actions_role", columnList = "role_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class RoleAction extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "role_actions_id_seq")
    @SequenceGenerator(name = "role_actions_id_seq", sequenceName = "role_actions_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "action_id", nullable = false)
    private Action action;
}
