package com.dietician.config;

import com.dietician.model.Role;
import com.dietician.model.User;
import com.dietician.repository.RoleRepository;
import com.dietician.repository.UserRepository;
import com.dietician.util.EmailHashUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds default admin and dietician users on application startup.
 * Uses the repositories so encryption/password encoding run through the normal pipeline.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class InitialUserSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUser(
                "admin.vaibhav.kripala@gmail.com",
                "Admin@123",
                "System Administrator",
                "ADMIN"
        );
        seedUser(
                "dietician.vaibhav.kripala@gmail.com",
                "Dietician@123",
                "Default Dietician",
                "DIETICIAN"
        );
    }

    private void seedUser(String email, String rawPassword, String fullName, String roleCode) {
        String emailHash = EmailHashUtil.hash(email);
        if (userRepository.existsByEmailSearchNative(emailHash)) {
            log.debug("Seed user {} already exists. Skipping creation.", email);
            return;
        }

        Role role = roleRepository.findByRoleCode(roleCode)
                .orElseThrow(() -> new IllegalStateException("Missing role " + roleCode + " in database"));

        User user = User.builder()
                .email(email)
                .emailSearch(emailHash)
                .password(passwordEncoder.encode(rawPassword))
                .emailVerified(true)
                .role(role)
                .fullName(fullName)
                .isActive(true)
                .build();

        userRepository.save(user);
        log.info("Seeded {} user {}", roleCode, email);
    }
}
