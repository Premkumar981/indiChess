package com.example.userservice.oauth;

import com.example.userservice.model.User;
import com.example.userservice.repo.UserRepo;
import com.example.userservice.service.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepo userRepo;

    public OAuth2SuccessHandler(JwtService jwtService, UserRepo userRepo) {
        this.jwtService = jwtService;
        this.userRepo = userRepo;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException {

        System.out.println("OAuth2 Login Successful. Principal: " + authentication.getPrincipal());
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");
        System.out.println("Extracted User Info: Email=" + email + ", Name=" + name);

        if (email == null) {
            System.err.println("Google login failed: Email not provided");
            response.sendRedirect("http://localhost:3000/login?error=Email not provided by Google");
            return;
        }

        String username = (name != null) ? name.replace(" ", "_").toLowerCase() : email.split("@")[0];
        System.out.println("Generated Username: " + username);

        String jwt = jwtService.generateToken(username);

        User user = userRepo.getUserByEmailId(email);
        if (user == null) {
            System.out.println("New Google user. Registering: " + email);
            user = new User();
            user.setEmailId(email);
            user.setUsername(username);
            user.setRating(250);
            try {
                userRepo.save(user);
                System.out.println("Google user saved successfully.");
            } catch (Exception e) {
                System.err.println("Error saving Google user: " + e.getMessage());
                response.sendRedirect("http://localhost:3000/login?error=Database error during Google signup");
                return;
            }
        } else {
            System.out.println("Existing Google user: " + email);
        }

        Cookie jwtCookie = new Cookie("JWT", jwt);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(3600);
        jwtCookie.setSecure(false);
        response.addCookie(jwtCookie);

        System.out.println("Redirecting to frontend home with JWT cookie.");
        response.sendRedirect("http://localhost:3000/home");
    }
}
