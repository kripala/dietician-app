package com.dietician.service;

import com.dietician.dto.AuthDto;
import com.dietician.model.Role;
import com.dietician.model.User;
import com.dietician.repository.RoleRepository;
import com.dietician.repository.UserRepository;
import com.dietician.util.EmailHashUtil;
import com.dietician.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * Authentication service handling user registration, login, and OTP verification.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Register a new user with email and password
     */
    @Transactional
    public AuthDto.MessageResponse register(AuthDto.RegisterRequest request) {
        // Check if user already exists
        String emailHash = EmailHashUtil.hash(request.getEmail());
        if (userRepository.existsByEmailSearch(emailHash)) {
            throw new RuntimeException("Email already registered");
        }

        // Generate OTP
        String otpCode = generateOtp();
        
        // Get PATIENT role
        Role patientRole = roleRepository.findByRoleCode("PATIENT")
                .orElseThrow(() -> new RuntimeException("PATIENT role not found in database"));
        
        // Create user
        User user = User.builder()
                .email(request.getEmail())
                .emailSearch(emailHash)
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .emailVerified(false)
                .otpCode(otpCode)
                .otpExpiry(LocalDateTime.now().plusMinutes(5))
                .role(patientRole)
                .isActive(true)
                .build();

        userRepository.save(user);
        log.info("User registered successfully: {}", request.getEmail());

        // Send OTP email
        emailService.sendOtpEmail(request.getEmail(), otpCode, request.getFullName());

        return new AuthDto.MessageResponse("Registration successful. Please check your email for OTP verification.");
    }

    /**
     * Login with email and password
     */
    @Transactional(readOnly = true)
    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        // Check if user exists and email is verified
        String emailHash = EmailHashUtil.hash(request.getEmail());
        User user = userRepository.findByEmailSearch(emailHash)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!user.getEmailVerified()) {
            throw new RuntimeException("Please verify your email first");
        }

        // Authenticate
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // Generate tokens
        String accessToken = tokenProvider.generateToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(request.getEmail());

        log.info("User logged in successfully: {}", request.getEmail());

        return new AuthDto.AuthResponse(
                accessToken,
                refreshToken,
                86400000L, // 24 hours
                mapToUserInfo(user)
        );
    }

    /**
     * Verify OTP code
     */
    @Transactional
    public AuthDto.AuthResponse verifyOtp(AuthDto.VerifyOtpRequest request) {
        String emailHash = EmailHashUtil.hash(request.getEmail());
        User user = userRepository.findByEmailSearch(emailHash)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check OTP
        if (user.getOtpCode() == null || !user.getOtpCode().equals(request.getOtpCode())) {
            throw new RuntimeException("Invalid OTP code");
        }

        // Check expiry
        if (user.getOtpExpiry() == null || LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            throw new RuntimeException("OTP code has expired");
        }

        // Mark email as verified
        user.setEmailVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        log.info("Email verified successfully: {}", request.getEmail());

        // Send welcome email
        emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());

        // Generate tokens
        String accessToken = tokenProvider.generateToken(user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getEmail());

        return new AuthDto.AuthResponse(
                accessToken,
                refreshToken,
                86400000L,
                mapToUserInfo(user)
        );
    }

    /**
     * Resend OTP code
     */
    @Transactional
    public AuthDto.MessageResponse resendOtp(AuthDto.ResendOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getEmailVerified()) {
            throw new RuntimeException("Email already verified");
        }

        // Generate new OTP
        String otpCode = generateOtp();
        user.setOtpCode(otpCode);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        // Send OTP email
        emailService.sendOtpEmail(user.getEmail(), otpCode, user.getFullName());

        log.info("OTP resent to: {}", request.getEmail());

        return new AuthDto.MessageResponse("OTP code has been resent to your email");
    }

    /**
     * Refresh access token
     */
    public AuthDto.AuthResponse refreshToken(AuthDto.RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }

        String email = tokenProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newAccessToken = tokenProvider.generateToken(email);

        return new AuthDto.AuthResponse(
                newAccessToken,
                refreshToken,
                86400000L,
                mapToUserInfo(user)
        );
    }

    /**
     * Handle Google OAuth login
     */
    @Transactional
    public AuthDto.AuthResponse handleOAuthLogin(String email, String googleId, String fullName, String pictureUrl) {
        User user = userRepository.findByGoogleId(googleId)
                .orElseGet(() -> {
                    // Check if email already exists
                    return userRepository.findByEmail(email)
                            .map(existingUser -> {
                                // Link Google account to existing user
                                existingUser.setGoogleId(googleId);
                                existingUser.setEmailVerified(true);
                                if (existingUser.getProfilePictureUrl() == null) {
                                    existingUser.setProfilePictureUrl(pictureUrl);
                                }
                                return userRepository.save(existingUser);
                            })
                            .orElseGet(() -> {
                                // Create new user
                                Role patientRole = roleRepository.findByRoleCode("PATIENT")
                                        .orElseThrow(() -> new RuntimeException("PATIENT role not found"));
                                User newUser = User.builder()
                                        .email(email)
                                        .googleId(googleId)
                                        .fullName(fullName)
                                        .profilePictureUrl(pictureUrl)
                                        .emailVerified(true)
                                        .role(patientRole)
                                        .isActive(true)
                                        .build();
                                return userRepository.save(newUser);
                            });
                });

        log.info("OAuth login successful: {}", email);

        // Generate tokens
        String accessToken = tokenProvider.generateToken(email);
        String refreshToken = tokenProvider.generateRefreshToken(email);

        return new AuthDto.AuthResponse(
                accessToken,
                refreshToken,
                86400000L,
                mapToUserInfo(user)
        );
    }

    private String generateOtp() {
        return String.format("%06d", secureRandom.nextInt(1000000));
    }

    private AuthDto.UserInfo mapToUserInfo(User user) {
        AuthDto.UserInfo userInfo = new AuthDto.UserInfo();
        userInfo.setId(user.getId());
        userInfo.setEmail(user.getEmail());
        userInfo.setFullName(user.getFullName());
        userInfo.setRole(user.getRole().getRoleCode());
        userInfo.setEmailVerified(user.getEmailVerified());
        userInfo.setProfilePictureUrl(user.getProfilePictureUrl());
        return userInfo;
    }
}
