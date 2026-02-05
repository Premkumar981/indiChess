package com.example.userservice.model.DTO;

public class LoginResponseDto {
    private String username;
    private String token;

    public LoginResponseDto(String username, String token) {
        this.username = username;
        this.token = token;
    }

    public LoginResponseDto() {
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
