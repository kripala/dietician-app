package com.dietician.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Entity representing user demographic profile information
 */
@Entity
@Table(name = "user_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id", callSuper = false)
public class UserProfile extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @SequenceGenerator(name = "user_profiles_id_seq", sequenceName = "user_profiles_id_seq", allocationSize = 1)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "middle_name", length = 100)
    private String middleName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "gender", length = 20)
    private String gender;

    @Column(name = "country_code", length = 10)
    private String countryCode;

    @Column(name = "mobile_number", length = 20)
    private String mobileNumber;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "address_line", length = 500)
    private String addressLine;

    @Column(name = "pincode", length = 20)
    private String pincode;

    @Column(name = "profile_photo_url", length = 500)
    private String profilePhotoUrl;
}
