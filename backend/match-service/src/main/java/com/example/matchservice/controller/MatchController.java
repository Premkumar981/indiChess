package com.example.matchservice.controller;

import com.example.matchservice.service.MatchService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/game")
public class MatchController {

    private final MatchService matchService;

    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Match service is working and updated!");
    }

    @PostMapping
    public ResponseEntity<Map<String, Long>> createMatch(HttpServletRequest request) {
        Optional<Long> matchIdOpt = matchService.createMatch(request);

        Map<String, Long> response = new HashMap<>();
        if (matchIdOpt.isPresent()) {
            response.put("matchId", matchIdOpt.get());
            return ResponseEntity.ok(response);
        } else {
            response.put("matchId", -2L);
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/bot")
    public ResponseEntity<Map<String, Long>> createBotMatch(HttpServletRequest request) {
        Optional<Long> matchIdOpt = matchService.createBotMatch(request);

        Map<String, Long> response = new HashMap<>();
        if (matchIdOpt.isPresent()) {
            response.put("matchId", matchIdOpt.get());
            return ResponseEntity.ok(response);
        } else {
            response.put("matchId", -2L);
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/create-room")
    public ResponseEntity<Map<String, String>> createRoom(HttpServletRequest request) {
        String roomCode = matchService.createRoom(request);
        if (roomCode != null) {
            return ResponseEntity.ok(Map.of("roomCode", roomCode));
        } else {
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/join-room/{code}")
    public ResponseEntity<Map<String, Long>> joinRoom(
            @PathVariable String code,
            HttpServletRequest request) {
        Optional<Long> matchIdOpt = matchService.joinRoom(code, request);

        Map<String, Long> response = new HashMap<>();
        if (matchIdOpt.isPresent()) {
            response.put("matchId", matchIdOpt.get());
            return ResponseEntity.ok(response);
        } else {
            response.put("matchId", -3L); // -3 for room not found/invalid
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/check-match")
    public ResponseEntity<Map<String, Long>> checkMatch(HttpServletRequest request) {
        Optional<Long> matchIdOpt = matchService.checkMatch(request);

        Map<String, Long> response = new HashMap<>();
        if (matchIdOpt.isPresent()) {
            response.put("matchId", matchIdOpt.get());
            return ResponseEntity.ok(response);
        } else {
            response.put("matchId", -2L);
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/cancel-waiting")
    public ResponseEntity<Map<String, Boolean>> cancelWaiting(HttpServletRequest request) {
        boolean cancelled = matchService.cancelWaiting(request);

        Map<String, Boolean> response = new HashMap<>();
        response.put("cancelled", cancelled);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{matchId}")
    public ResponseEntity<Map<String, Object>> getGameDetails(
            @PathVariable Long matchId,
            HttpServletRequest request) {

        try {
            Map<String, Object> response = matchService.getGameDetailsForFrontend(matchId, request);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            if (e.getMessage().contains("Not authenticated")) {
                return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
            } else if (e.getMessage().contains("Not authorized")) {
                return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
            } else if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }
}
