package com.nutrition.backend.infrastructure.ratelimit;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitFilterTest {

    private RateLimitFilter filter(long authCapacity, long supportCapacity) {
        return new RateLimitFilter(
                new RateLimiter(authCapacity, Duration.ofMinutes(1)),
                new RateLimiter(supportCapacity, Duration.ofMinutes(1)));
    }

    private MockHttpServletRequest request(String method, String uri, String ip) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setRemoteAddr(ip);
        return request;
    }

    @Test
    void should_pass_the_request_through_when_under_the_limit() throws Exception {
        RateLimitFilter filter = filter(5, 5);
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request("POST", "/api/auth/login", "1.2.3.4"), response, chain);

        assertThat(chain.getRequest()).isNotNull();
        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    void should_return_429_when_the_auth_limit_is_exceeded() throws Exception {
        RateLimitFilter filter = filter(1, 5);
        filter.doFilter(request("POST", "/api/auth/login", "1.2.3.4"),
                new MockHttpServletResponse(), new MockFilterChain());

        MockHttpServletResponse blocked = new MockHttpServletResponse();
        MockFilterChain blockedChain = new MockFilterChain();
        filter.doFilter(request("POST", "/api/auth/login", "1.2.3.4"), blocked, blockedChain);

        assertThat(blocked.getStatus()).isEqualTo(429);
        assertThat(blockedChain.getRequest()).isNull();
    }

    @Test
    void should_not_rate_limit_paths_that_are_not_targeted() throws Exception {
        RateLimitFilter filter = filter(1, 1);

        for (int i = 0; i < 3; i++) {
            MockFilterChain chain = new MockFilterChain();
            filter.doFilter(request("GET", "/api/daily-kcal", "1.2.3.4"),
                    new MockHttpServletResponse(), chain);
            assertThat(chain.getRequest()).isNotNull();
        }
    }

    @Test
    void should_count_each_client_ip_independently() throws Exception {
        RateLimitFilter filter = filter(1, 5);

        filter.doFilter(request("POST", "/api/auth/login", "1.1.1.1"),
                new MockHttpServletResponse(), new MockFilterChain());
        MockHttpServletResponse otherClient = new MockHttpServletResponse();
        filter.doFilter(request("POST", "/api/auth/login", "2.2.2.2"),
                otherClient, new MockFilterChain());

        assertThat(otherClient.getStatus()).isEqualTo(200);
    }

    @Test
    void should_limit_the_support_endpoint_with_its_own_bucket() throws Exception {
        RateLimitFilter filter = filter(50, 1);
        filter.doFilter(request("POST", "/api/support", "1.2.3.4"),
                new MockHttpServletResponse(), new MockFilterChain());

        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilter(request("POST", "/api/support", "1.2.3.4"),
                blocked, new MockFilterChain());

        assertThat(blocked.getStatus()).isEqualTo(429);
    }

    @Test
    void should_isolate_clients_behind_a_proxy_using_the_forwarded_ip() throws Exception {
        RateLimitFilter filter = filter(1, 5);

        MockHttpServletRequest first = request("POST", "/api/auth/login", "10.0.0.1");
        first.addHeader("X-Forwarded-For", "203.0.113.1");
        filter.doFilter(first, new MockHttpServletResponse(), new MockFilterChain());

        MockHttpServletRequest second = request("POST", "/api/auth/login", "10.0.0.1");
        second.addHeader("X-Forwarded-For", "203.0.113.2");
        MockHttpServletResponse otherClient = new MockHttpServletResponse();
        filter.doFilter(second, otherClient, new MockFilterChain());

        // Deux clients distincts derrière le même proxy ne partagent pas le seau.
        assertThat(otherClient.getStatus()).isEqualTo(200);
    }
}
