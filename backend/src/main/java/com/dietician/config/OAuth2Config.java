package com.dietician.config;

import com.dietician.service.AuthService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.*;

/**
 * OAuth2 configuration for Google Sign-In.
 * Handles OAuth2 user authentication and JWT token generation.
 */
@Slf4j
@Configuration
public class OAuth2Config {

    /**
     * Custom success handler for OAuth2 authentication.
     * Returns JWT tokens in the response after successful OAuth login.
     */
    @Bean
    public AuthenticationSuccessHandler oauth2AuthenticationSuccessHandler(@Lazy AuthService authService) {
        return new OAuth2AuthenticationSuccessHandler(authService);
    }

    /**
     * Custom OAuth2UserService to fetch and process Google user information.
     * Extracts email, Google ID, name, and profile picture from Google's userinfo endpoint.
     */
    @Bean
    public OAuth2UserService<OAuth2UserRequest, OAuth2User> oauth2UserService() {
        return new CustomOAuth2UserService();
    }

    /**
     * Custom OAuth2 User Service that fetches user details from Google.
     */
    private static class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {
        private final RestTemplate restTemplate = new RestTemplate();
        private final ObjectMapper objectMapper = new ObjectMapper();

        @Override
        public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
            String userInfoUri = userRequest.getClientRegistration()
                    .getProviderDetails()
                    .getUserInfoEndpoint()
                    .getUri();

            String accessToken = userRequest.getAccessToken().getTokenValue();

            try {
                // Fetch user info from Google
                String response = restTemplate.getForObject(
                        userInfoUri + "?access_token=" + accessToken,
                        String.class
                );

                JsonNode jsonNode = objectMapper.readTree(response);

                // Create a map of user attributes
                Map<String, Object> attributes = new HashMap<>();
                attributes.put("sub", jsonNode.path("sub").asText());
                attributes.put("email", jsonNode.path("email").asText());
                attributes.put("name", jsonNode.path("name").asText());
                attributes.put("picture", jsonNode.path("picture").asText());
                attributes.put("email_verified", jsonNode.path("email_verified").asBoolean());

                log.info("OAuth2 user info fetched for: {}", attributes.get("email"));

                return new GoogleOAuth2User(attributes);

            } catch (Exception e) {
                log.error("Error fetching OAuth2 user info", e);
                throw new OAuth2AuthenticationException("Failed to fetch user information from Google");
            }
        }
    }

    /**
     * Custom OAuth2User implementation for Google users.
     */
    public static class GoogleOAuth2User implements OAuth2User {
        private final Map<String, Object> attributes;

        public GoogleOAuth2User(Map<String, Object> attributes) {
            this.attributes = attributes;
        }

        @Override
        public Map<String, Object> getAttributes() {
            return attributes;
        }

        @Override
        public String getName() {
            return (String) attributes.get("name");
        }

        @Override
        public Collection<? extends GrantedAuthority> getAuthorities() {
            return Collections.emptyList();
        }

        public String getEmail() {
            return (String) attributes.get("email");
        }

        public String getGoogleId() {
            return (String) attributes.get("sub");
        }

        public String getPicture() {
            return (String) attributes.get("picture");
        }

        public Boolean isEmailVerified() {
            return (Boolean) attributes.get("email_verified");
        }
    }

    /**
     * Authentication success handler that uses one-time code exchange.
     * No tokens in URL - secure and clean.
     */
    @Slf4j
    public static class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {
        private final AuthService authService;
        private final ObjectMapper objectMapper = new ObjectMapper();

        // In-memory store for one-time codes (in production, use Redis)
        private static final java.util.concurrent.ConcurrentHashMap<String, OAuthData> CODE_STORE = new java.util.concurrent.ConcurrentHashMap<>();
        private static final long CODE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

        public OAuth2AuthenticationSuccessHandler(AuthService authService) {
            this.authService = authService;
            // Clean up expired codes every minute
            java.util.Timer cleanupTimer = new java.util.Timer(true);
            cleanupTimer.schedule(new java.util.TimerTask() {
                @Override
                public void run() {
                    long now = System.currentTimeMillis();
                    CODE_STORE.entrySet().removeIf(entry -> entry.getValue().createdAt + CODE_EXPIRY_MS < now);
                }
            }, 60000, 60000);
        }

        @Override
        public void onAuthenticationSuccess(
                HttpServletRequest request,
                HttpServletResponse response,
                Authentication authentication) throws IOException, ServletException {

            OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
            GoogleOAuth2User oauthUser = (GoogleOAuth2User) oauthToken.getPrincipal();

            String email = oauthUser.getEmail();
            String googleId = oauthUser.getGoogleId();
            String fullName = oauthUser.getName();
            String pictureUrl = oauthUser.getPicture();

            log.info("OAuth2 login success for: {}", email);

            try {
                // Use AuthService to handle OAuth login and generate JWT tokens
                var authResponse = authService.handleOAuthLogin(email, googleId, fullName, pictureUrl);

                // Generate a one-time code
                String oneTimeCode = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16);

                // Store the auth response with the code
                CODE_STORE.put(oneTimeCode, new OAuthData(authResponse, System.currentTimeMillis()));

                // Check if this is a web client
                String userAgent = request.getHeader("User-Agent");
                boolean isWebClient = (userAgent != null && (userAgent.contains("Mozilla") || userAgent.contains("Chrome") || userAgent.contains("Safari")));

                // For web clients, redirect to frontend with just the code (clean URL!)
                if (isWebClient) {
                    // Determine the actual protocol (handle X-Forwarded-Proto from nginx)
                    String scheme = request.getHeader("X-Forwarded-Proto");
                    if (scheme == null || scheme.isEmpty()) {
                        scheme = request.getScheme();
                    }

                    String host = request.getServerName();
                    int serverPort = request.getServerPort();

                    // For production (VPS), frontend and backend share same domain via nginx
                    // For local development, frontend is on port 8081
                    boolean isLocalDev = host.equals("localhost") || host.startsWith("192.168") ||
                                       host.startsWith("10.") || host.startsWith("172.16") ||
                                       host.equals("127.0.0.1");

                    StringBuilder frontendUrl = new StringBuilder();
                    frontendUrl.append(scheme).append("://").append(host);

                    if (isLocalDev) {
                        // Local development - frontend on port 8081
                        frontendUrl.append(":8081");
                    }
                    // For production, no port needed (nginx handles routing on standard ports)

                    frontendUrl.append("/oauth-callback");
                    String redirectUrl = frontendUrl + "?code=" + oneTimeCode;

                    log.info("Redirecting web client to: {} with code", frontendUrl);
                    response.sendRedirect(redirectUrl);
                } else {
                    // For native clients, return JSON response
                    Map<String, Object> responseData = new HashMap<>();
                    responseData.put("accessToken", authResponse.getAccessToken());
                    responseData.put("refreshToken", authResponse.getRefreshToken());
                    responseData.put("expiresIn", authResponse.getExpiresIn());

                    Map<String, Object> userInfo = new HashMap<>();
                    userInfo.put("id", authResponse.getUser().getId());
                    userInfo.put("email", authResponse.getUser().getEmail());
                    userInfo.put("fullName", authResponse.getUser().getFullName());
                    userInfo.put("role", authResponse.getUser().getRole());
                    userInfo.put("emailVerified", authResponse.getUser().getEmailVerified());
                    userInfo.put("profilePictureUrl", authResponse.getUser().getProfilePictureUrl());
                    responseData.put("user", userInfo);

                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.setStatus(HttpServletResponse.SC_OK);

                    String jsonResponse = objectMapper.writeValueAsString(responseData);
                    response.getWriter().write(jsonResponse);
                }

                log.info("OAuth code generated for user: {}", email);

            } catch (Exception e) {
                log.error("Error handling OAuth2 success for: {}", email, e);
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Authentication failed\",\"message\":\"Failed to process OAuth login\"}");
            }
        }

        /**
         * Get OAuth data by code and remove it (one-time use)
         */
        public static OAuthData getAndRemoveCode(String code) {
            OAuthData data = CODE_STORE.remove(code);
            if (data == null) {
                return null;
            }
            // Check expiry
            if (System.currentTimeMillis() - data.createdAt > CODE_EXPIRY_MS) {
                return null;
            }
            return data;
        }

        /**
         * Data class to store OAuth response with timestamp
         */
        public static class OAuthData {
            private final com.dietician.dto.AuthDto.AuthResponse authResponse;
            private final long createdAt;

            public OAuthData(com.dietician.dto.AuthDto.AuthResponse authResponse, long createdAt) {
                this.authResponse = authResponse;
                this.createdAt = createdAt;
            }

            public com.dietician.dto.AuthDto.AuthResponse getAuthResponse() {
                return authResponse;
            }
        }
    }
}
