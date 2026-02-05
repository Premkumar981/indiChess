package com.example.userservice.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

    private final String SECRET = "aluesgo8q37g4tifqbhrefg8g3124ib801g7br18b7gb17g4b";

    public String generateToken(String username) {
        return Jwts.builder().
                setSubject(username).
                setIssuedAt(new Date(System.currentTimeMillis())).
                setExpiration(new Date(System.currentTimeMillis() + 1000*60*60*5)).
                signWith(getKey(), SignatureAlgorithm.HS256).
                compact();
    }

    Key getKey(){
        byte [] bytekey = Decoders.BASE64.decode(SECRET);
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
    
    public boolean isTokenValid(String token, UserDetails userDetails) {
        return extractUsername(token).equals(userDetails.getUsername())
                && !isTokenExpired(token);
    }
    
    private boolean isTokenExpired(String token) {
        return extractClaims(token).getExpiration().before(new Date());
    }
}
