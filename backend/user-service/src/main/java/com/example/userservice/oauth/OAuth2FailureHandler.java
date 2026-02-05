package com.example.userservice.oauth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2FailureHandler implements AuthenticationFailureHandler {

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception) throws IOException {

        System.err.println("OAuth2 Authentication Failed: " + exception.getMessage());
        exception.printStackTrace();

        response.sendRedirect("http://localhost:3000/login?error=Google login failed: " + exception.getMessage());
    }
}
