package com.example.userservice.controller;

import com.example.userservice.model.DTO.LoginDto;
import com.example.userservice.model.DTO.LoginResponseDto;
import com.example.userservice.model.User;
import com.example.userservice.service.AuthService;
import com.example.userservice.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/")
public class AuthController {

    private final AuthService authservice;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthController(AuthService authservice, AuthenticationManager authenticationManager, JwtService jwtService) {
        this.authservice = authservice;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @GetMapping("/")
    public ResponseEntity<String> welcome() {
        return ResponseEntity.ok("IndiChess User Service is UP and Alive!");
    }

    @PostMapping("signup")
    public ResponseEntity<?> handleSignup(@RequestBody User user) {
        try {
            return new ResponseEntity<>(authservice.save(user), HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>("Signup failed: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("login")
    public ResponseEntity<?> handleLogin(HttpServletRequest request,
            HttpServletResponse response,
            @RequestBody LoginDto loginDto) throws IOException {

        Authentication authObject = authenticationManager
                .authenticate(new UsernamePasswordAuthenticationToken(loginDto.getUsername(), loginDto.getPassword()));
        if (authObject.isAuthenticated()) {
            String tk = jwtService.generateToken(loginDto.getUsername());

            ResponseCookie cookie = ResponseCookie.from("JWT", tk).httpOnly(true).secure(false).sameSite("lax")
                    .path("/").maxAge(3600).build();
            response.setHeader(HttpHeaders.SET_COOKIE, cookie.toString());

            return ResponseEntity.ok(tk);
        }

        return new ResponseEntity<>(new LoginResponseDto(null, "Auth Failed"), HttpStatus.BAD_REQUEST);
    }

    @PostMapping("logout")
    public ResponseEntity<?> handleLogout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("JWT", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("lax")
                .path("/")
                .maxAge(0) // Clear the cookie
                .build();
        response.setHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok("Logged out successfully");
    }

    @GetMapping("login")
    public ResponseEntity<String> showLoginPage() {
        return new ResponseEntity<>("Please login via frontend (http://localhost:3000) or POST to /login.",
                HttpStatus.OK);
    }

    @GetMapping("home")
    public ResponseEntity<java.util.List<String>> getCountries() {
        return ResponseEntity.ok(java.util.Arrays.asList("India", "USA", "UK", "Canada", "Germany", "France", "Japan",
                "Australia", "Brazil", "Russia"));
    }

}
