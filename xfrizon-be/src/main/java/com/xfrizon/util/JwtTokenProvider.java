package com.xfrizon.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${jwt.oauth-signup-expiration:900000}")
    private long oauthSignupExpiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(String email, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        return createToken(claims, email);
    }

    public String generateOAuthSignupToken(String email, Map<String, Object> claims) {
        Map<String, Object> tokenClaims = new HashMap<>(claims == null ? Map.of() : claims);
        tokenClaims.put("purpose", "GOOGLE_SIGNUP");
        return createToken(tokenClaims, email, oauthSignupExpiration);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return createToken(claims, subject, jwtExpiration);
    }

    private String createToken(Map<String, Object> claims, String subject, long expirationMillis) {
        Instant now = Instant.now();
        Instant expiryTime = now.plusSeconds(Math.max(1, expirationMillis / 1000));

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiryTime))
                .signWith(getSigningKey())
                .compact();
    }

    public String getEmailFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        return claims.getSubject();
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        Object userId = claims.get("userId");
        if (userId == null) {
            throw new IllegalArgumentException("Invalid token: missing userId claim");
        }
        if (!(userId instanceof Number)) {
            throw new IllegalArgumentException("Invalid token: userId claim is not a number");
        }
        return ((Number) userId).longValue();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Claims getClaims(String token) {
        return getAllClaimsFromToken(token);
    }

    private Claims getAllClaimsFromToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid or expired token");
        }
    }
}
