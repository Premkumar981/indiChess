package com.example.matchservice.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.security.Key;

@Service
public class JwtService {

    private final String SECRET = "aluesgo8q37g4tifqbhrefg8g3124ib801g7br18b7gb17g4b";

    Key getKey() {
        byte[] bytekey = Decoders.BASE64.decode(SECRET);
        return Keys.hmacShaKeyFor(bytekey);
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    private Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
