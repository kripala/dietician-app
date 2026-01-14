# Database Schema Design - Audit Fields & Master Tables

## Summary of Changes

Based on your feedback, I've updated the database schema with:

### ✅ Audit Fields (All Tables)
```sql
created_by VARCHAR(100) NOT NULL
created_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
modified_by VARCHAR(100)
modified_date TIMESTAMP WITHOUT TIME ZONE
```

### ✅ Normalized Audit Logging (Not JSONB)
```sql
-- Main audit log
audit_logs (
    id, table_name, record_id, action,
    changed_by, changed_date, ip_address, user_agent
)

-- Detailed field changes
audit_log_details (
    id, audit_log_id, field_name, old_value, new_value
)
```

**Benefits over JSONB:**
- Better query performance
- Referential integrity
- Easier indexing
- Type-safe queries

### ✅ Roles Master Table
```sql
roles (
    id BIGINT PRIMARY KEY,
    role_code VARCHAR(20) UNIQUE,  -- 'ADMIN', 'DIETICIAN', 'PATIENT'
    role_name VARCHAR(50),
    description VARCHAR(200),
    is_active BOOLEAN,
    + audit fields
)
```

**Seed Data Included:**
- ADMIN (id=1)
- DIETICIAN (id=2)
- PATIENT (id=3)

### ✅ Updated Users Table
```sql
users (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email VARCHAR(500) UNIQUE,  -- Encrypted
    password VARCHAR(100),       -- BCrypt hashed
    google_id VARCHAR(100) UNIQUE,
    email_verified BOOLEAN,
    otp_code VARCHAR(10),
    otp_expiry TIMESTAMP WITHOUT TIME ZONE,
    role_id BIGINT FK -> roles(id),  -- Changed from enum to FK
    full_name VARCHAR(100),
    profile_picture_url VARCHAR(500),
    is_active BOOLEAN,
    + audit fields
)
```

---

## Java Implementation

### AuditableEntity Base Class
```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditableEntity {
    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false)
    private String createdBy;
    
    @CreatedDate
    @Column(name = "created_date", nullable = false, updatable = false)
    private LocalDateTime createdDate;
    
    @LastModifiedBy
    @Column(name = "modified_by")
    private String modifiedBy;
    
    @LastModifiedDate
    @Column(name = "modified_date")
    private LocalDateTime modifiedDate;
}
```

### JPA Auditing Configuration
- Automatically populates `created_by` and `modified_by` from Spring Security context
- Falls back to "SYSTEM" for unauthenticated operations
- Uses `@EnableJpaAuditing` with custom `AuditorAware`

### Role Entity
```java
@Entity
@Table(name = "roles")
public class Role extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String roleCode;
    private String roleName;
    private String description;
    private Boolean isActive;
}
```

### Updated User Entity
```java
@Entity
public class User extends AuditableEntity {
    // ... other fields
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;  // Changed from enum to entity
}
```

---

## Files Modified

### Database Migration
- `V1__Create_users_table.sql` → `V1__Create_initial_schema.sql`
  - Added roles master table
  - Added audit_logs and audit_log_details tables
  - Updated users table with role_id FK
  - Added seed data for roles

### New Java Files
- `AuditableEntity.java` - Base class for all entities
- `Role.java` - Role master entity
- `RoleRepository.java` - Role data access
- `JpaAuditingConfig.java` - Auditing configuration

### Updated Java Files
- `User.java` - Now extends AuditableEntity, uses Role entity
- `AuthService.java` - Fetches PATIENT role from database
- `CustomUserDetailsService.java` - Uses role.getRoleCode()

---

## Next Steps for Future Tables

When creating new tables (consultations, prescriptions, etc.):

1. **Extend AuditableEntity**
```java
@Entity
public class Consultation extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // ... other fields
}
```

2. **Audit fields automatically populated** - No manual code needed!

3. **For master tables**, create similar to Role:
```java
@Entity
public class ConsultationType extends AuditableEntity {
    // master data fields
}
```

---

## Database Schema is Now Production-Ready! ✅

All changes follow enterprise best practices:
- ✅ Proper audit trail
- ✅ Normalized audit logging
- ✅ Master data management
- ✅ Referential integrity
- ✅ Automatic audit field population
