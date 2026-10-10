package com.nutrition.backend.infrastructure.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Filtre anti-abus : limite le débit des points d'entrée publics sensibles
 * (authentification) et de l'envoi de messages support.
 * <p>
 * Clé de comptage = identité authentifiée si disponible, sinon adresse IP du
 * client : {@code X-Real-IP} posé par nginx, à défaut l'adresse de connexion.
 * {@code X-Forwarded-For} est ignoré : sa première valeur vient du client, qui
 * pourrait la changer à chaque requête pour échapper à la limite.
 * Au-delà de la limite, répond {@code 429 Too Many Requests} sans exécuter la
 * suite de la chaîne.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> RATE_LIMITED_AUTH_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/forgot-password",
            "/api/auth/reset-password");

    private static final String SUPPORT_PATH = "/api/support";

    private final RateLimiter authLimiter;
    private final RateLimiter supportLimiter;

    public RateLimitFilter(RateLimiter authLimiter, RateLimiter supportLimiter) {
        this.authLimiter = authLimiter;
        this.supportLimiter = supportLimiter;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        RateLimiter limiter = resolveLimiter(request);
        if (limiter == null) {
            filterChain.doFilter(request, response);
            return;
        }

        if (limiter.tryConsume(resolveClientKey(request))) {
            filterChain.doFilter(request, response);
        } else {
            rejectWithTooManyRequests(response);
        }
    }

    private RateLimiter resolveLimiter(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return null;
        }
        String path = request.getRequestURI();
        if (RATE_LIMITED_AUTH_PATHS.contains(path)) {
            return authLimiter;
        }
        if (SUPPORT_PATH.equals(path)) {
            return supportLimiter;
        }
        return null;
    }

    private String resolveClientKey(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && authentication.getName() != null
                && !"anonymousUser".equals(authentication.getName())) {
            return "user:" + authentication.getName();
        }
        return "ip:" + resolveClientIp(request);
    }

    private String resolveClientIp(HttpServletRequest request) {
        // nginx écrase X-Real-IP avec l'adresse TCP réelle (proxy_set_header X-Real-IP $remote_addr).
        // Ne pas se fier à getRemoteAddr() seul : avec forward-headers-strategy=framework,
        // Spring le déduit de X-Forwarded-For, donc d'une valeur fournie par le client.
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    private void rejectWithTooManyRequests(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(
                "{\"status\":429,\"error\":\"Trop de requêtes — réessayez plus tard.\"}");
    }
}
