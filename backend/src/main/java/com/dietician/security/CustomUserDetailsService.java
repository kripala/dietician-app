package com.dietician.security;

import com.dietician.util.EmailHashUtil;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Collections;

/**
 * Custom UserDetailsService for loading user-specific data.
 * Uses native queries to avoid encrypted email field issues.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        String emailHash = EmailHashUtil.hash(email);

        // Use native query to get user data without encrypted email
        String nativeQuery = """
            SELECT u.password, u.is_active, u.email_verified, r.role_code
            FROM diet.users u
            JOIN diet.roles r ON u.role_id = r.id
            WHERE u.email_search = :emailHash
            """;

        Object[] result;
        try {
            result = (Object[]) entityManager.createNativeQuery(nativeQuery)
                    .setParameter("emailHash", emailHash)
                    .getSingleResult();
        } catch (Exception e) {
            log.error("User not found with email hash: {}", emailHash, e);
            throw new UsernameNotFoundException("User not found with email: " + email);
        }

        String password = (String) result[0];
        Boolean isActive = (Boolean) result[1];
        Boolean emailVerified = (Boolean) result[2];
        String roleCode = (String) result[3];

        return org.springframework.security.core.userdetails.User.builder()
                .username(email) // Use the email from parameter, not from DB
                .password(password != null ? password : "")
                .authorities(getAuthorities(roleCode))
                .accountExpired(false)
                .accountLocked(Boolean.FALSE.equals(isActive))
                .credentialsExpired(false)
                .disabled(Boolean.FALSE.equals(isActive) || Boolean.FALSE.equals(emailVerified))
                .build();
    }

    private Collection<? extends GrantedAuthority> getAuthorities(String roleCode) {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + roleCode));
    }
}
