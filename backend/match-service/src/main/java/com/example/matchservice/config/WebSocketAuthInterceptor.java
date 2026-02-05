package com.example.matchservice.config;

import com.example.matchservice.service.JwtService;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;

@Configuration
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    public WebSocketAuthInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Log all native headers for debugging
            Map<String, List<String>> nativeHeaders = (Map<String, List<String>>) accessor
                    .getHeader(StompHeaderAccessor.NATIVE_HEADERS);
            if (nativeHeaders != null) {
                System.out.println("📋 STOMP NATIVE HEADERS: " + nativeHeaders.keySet());
            }

            String token = extractToken(accessor);
            System.out.println("🔌 STOMP Connect attempt. Token found: " + (token != null));

            if (token != null) {
                String username = jwtService.extractUsername(token);
                System.out.println("👤 STOMP Connect username extracted: " + username);
                if (username != null) {
                    UserDetails userDetails = User.withUsername(username)
                            .password("")
                            .authorities("USER")
                            .build();

                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    accessor.setUser(authentication);
                    System.out.println("✅ Security context set for STOMP session: " + username);
                } else {
                    System.err.println("❌ STOMP Connect: Extract username failed for token");
                }
            } else {
                System.err.println("❌ STOMP Connect: No Authorization token found in headers");
            }
        }

        return message;
    }

    private String extractToken(StompHeaderAccessor accessor) {
        // 1. Try session attributes (populated by HandshakeInterceptor)
        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes != null && sessionAttributes.containsKey("token")) {
            String token = (String) sessionAttributes.get("token");
            if (token != null && !token.isEmpty()) {
                System.out.println("💎 Found token in session attributes");
                return token;
            }
        }

        // 2. Try various versions of the header
        String[] headerNames = { "Authorization", "authorization", "Auth", "auth", "token", "Token", "passcode" };
        for (String name : headerNames) {
            List<String> headers = accessor.getNativeHeader(name);
            if (headers != null && !headers.isEmpty()) {
                String val = headers.get(0);
                System.out.println("🔎 Found header '" + name + "': " + (val != null ? "exists" : "null"));
                if (val != null && val.startsWith("Bearer ")) {
                    return val.substring(7);
                } else if (val != null && !val.isEmpty()) {
                    return val;
                }
            }
        }

        String query = accessor.getFirstNativeHeader("query");
        if (query != null && query.contains("token=")) {
            return query.substring(query.indexOf("token=") + 6);
        }

        // 4. Try to find in Cookies directly from the session attributes if populated
        // by HandshakeInterceptor
        // or via accessor headers (though native headers often miss cookies in STOMP)
        List<String> cookieHeaders = accessor.getNativeHeader("Cookie");
        if (cookieHeaders != null && !cookieHeaders.isEmpty()) {
            for (String cookieHeader : cookieHeaders) {
                String[] cookies = cookieHeader.split(";");
                for (String cookie : cookies) {
                    cookie = cookie.trim();
                    if (cookie.startsWith("JWT=")) {
                        return cookie.substring(4);
                    }
                }
            }
        }

        return null;
    }
}
