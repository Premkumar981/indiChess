package com.example.userservice.service;

import com.example.userservice.model.User;
import com.example.userservice.repo.UserRepo;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepo userRepo;

    public UserService(UserRepo userRepo) {
        this.userRepo = userRepo;
    }

    public String getUserbyUsername(String username) {
        return userRepo.getUserByUsername(username).getUsername();
    }

    public User findByEmail(String email) {
        return userRepo.getUserByEmailId(email);
    }
}
