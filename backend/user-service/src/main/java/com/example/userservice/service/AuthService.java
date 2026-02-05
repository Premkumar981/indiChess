package com.example.userservice.service;

import com.example.userservice.model.User;
import com.example.userservice.repo.UserRepo;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepo userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    public User save(User user) {
        System.out.println("Processing signup for user: " + user.getUsername());
        if (userRepo.getUserByUsername(user.getUsername()) != null) {
            System.out.println("Signup failed: Username already exists");
            throw new RuntimeException("Username already exists");
        }
        if (userRepo.getUserByEmailId(user.getEmailId()) != null) {
            System.out.println("Signup failed: Email already registered");
            throw new RuntimeException("Email already registered");
        }

        try {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setRating(250); // default rating
            User saved = userRepo.save(user);
            System.out.println("Signup successful for user: " + saved.getUsername());
            return saved;
        } catch (Exception e) {
            System.err.println("Database error during signup: " + e.getMessage());
            throw new RuntimeException("Database error: " + e.getMessage());
        }
    }
}
