package com.xfrizon.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.context.annotation.Bean;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final ObjectProvider<ClientRegistrationRepository> clientRegistrationRepositoryProvider;
    private final GoogleOAuthHandlers googleOAuthHandlers;

    public SecurityConfig(
        ObjectProvider<ClientRegistrationRepository> clientRegistrationRepositoryProvider,
        GoogleOAuthHandlers googleOAuthHandlers
    ) {
        this.clientRegistrationRepositoryProvider = clientRegistrationRepositoryProvider;
        this.googleOAuthHandlers = googleOAuthHandlers;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
            // OAuth2 login requires temporary session state during provider redirect/callback.
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(authz -> authz
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                            "/auth/register",
                            "/auth/register-organizer",
                            "/auth/login",
                            "/auth/validate-token",
                            "/api/v1/auth/register",
                            "/api/v1/auth/register-organizer",
                            "/api/v1/auth/login",
                            "/api/v1/auth/validate-token",
                            "/api/v1/auth/oauth/google/complete-signup",
                            "/oauth2/**",
                            "/login/oauth2/**"
                        )
                        .permitAll()
                        .requestMatchers("/api/v1/events/public/**")
                        .permitAll()
                        .anyRequest()
                        .permitAll()
                )
                .httpBasic(basic -> basic.disable());

        if (clientRegistrationRepositoryProvider.getIfAvailable() != null) {
            http.oauth2Login(oauth -> oauth
                .successHandler(googleOAuthHandlers)
                .failureHandler(googleOAuthHandlers)
            );
        }

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
            "http://localhost:5177",
            "http://localhost:3000",
            "http://localhost:8080",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5177",
            "https://xfrizon.up.railway.app",
            "https://xfrizonprod-production.up.railway.app",
            "https://xfrizon-ts.com"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
