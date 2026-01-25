package com.dietician.config;

import com.dietician.security.CustomPermissionEvaluator;
import com.dietician.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security configuration with JWT authentication and OAuth 2.0 support.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;
    private final CustomPermissionEvaluator customPermissionEvaluator;

    @Autowired
    private AuthenticationSuccessHandler oauth2SuccessHandler;

    @Autowired
    private ClientRegistrationRepository clientRegistrationRepository;

    /**
     * Custom OAuth2 authorization request resolver that dynamically sets the redirect URI
     * based on the incoming request's host. This allows OAuth to work from localhost,
     * local IP, or any domain without hardcoding redirect URIs.
     */
    @Bean
    public OAuth2AuthorizationRequestResolver customAuthorizationRequestResolver() {
        org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver defaultResolver =
            new org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository,
                "/auth/oauth2/authorize"
            );

        return new OAuth2AuthorizationRequestResolver() {
            @Override
            public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
                OAuth2AuthorizationRequest authorizationRequest = defaultResolver.resolve(request);
                return customizeRedirectUri(request, authorizationRequest);
            }

            @Override
            public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
                OAuth2AuthorizationRequest authorizationRequest = defaultResolver.resolve(request, clientRegistrationId);
                return customizeRedirectUri(request, authorizationRequest);
            }

            private OAuth2AuthorizationRequest customizeRedirectUri(HttpServletRequest request, OAuth2AuthorizationRequest authorizationRequest) {
                if (authorizationRequest == null) {
                    return null;
                }

                // Determine actual protocol and host (handle X-Forwarded-* headers from nginx)
                String scheme = request.getHeader("X-Forwarded-Proto");
                if (scheme == null || scheme.isEmpty()) {
                    scheme = request.getScheme();
                }

                String host = request.getHeader("X-Forwarded-Host");
                if (host == null || host.isEmpty()) {
                    host = request.getServerName();
                }

                String contextPath = request.getContextPath(); // /api

                StringBuilder redirectUri = new StringBuilder();
                redirectUri.append(scheme).append("://").append(host);
                redirectUri.append(contextPath);
                redirectUri.append("/auth/oauth2/callback/google");

                // Create a new authorization request with the custom redirect URI
                // Add prompt=select_account to force Google to show account chooser
                return OAuth2AuthorizationRequest.from(authorizationRequest)
                        .redirectUri(redirectUri.toString())
                        .additionalParameters(java.util.Map.of("prompt", "select_account"))
                        .build();
            }
        };
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers(
                                "/auth/register",
                                "/auth/login",
                                "/auth/verify-email",
                                "/auth/resend-otp",
                                "/auth/refresh",
                                "/auth/logout",
                                "/auth/health",
                                "/auth/oauth2/**",
                                "/admin/roles",  // Public for dynamic frontend rendering
                                "/public/**",
                                "/files/**",
                                "/error"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(authorization -> authorization
                                .baseUri("/auth/oauth2/authorize")
                                .authorizationRequestResolver(customAuthorizationRequestResolver()))
                        .redirectionEndpoint(redirection -> redirection
                                .baseUri("/auth/oauth2/callback/*"))
                        .successHandler(oauth2SuccessHandler)
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}");
                        })
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*")); // Configure properly in production
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Configure method security to use custom permission evaluator.
     * This enables @PreAuthorize("hasPermission(...)") annotations.
     */
    @Bean
    protected DefaultMethodSecurityExpressionHandler methodSecurityExpressionHandler() {
        DefaultMethodSecurityExpressionHandler handler = new DefaultMethodSecurityExpressionHandler();
        handler.setPermissionEvaluator(customPermissionEvaluator);
        return handler;
    }
}
