package com.example.matchservice.controller;

import com.example.matchservice.model.DTO.*;
import com.example.matchservice.service.GameService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @MessageMapping("/game/{matchId}/move")
    public void handleMove(@DestinationVariable Long matchId,
            @Payload MoveRequest moveRequest,
            Principal principal) {
        try {
            if (principal == null) {
                System.err.println("❌ ERROR: Principal is null in handleMove");
                notifyMoveError(matchId, "Authentication required", moveRequest);
                return;
            }
            System.out.println("📬 Received move for game " + matchId + " from " + principal.getName());

            MoveDTO result = gameService.processMove(matchId, moveRequest, principal);

            if (result != null && result.getMoveNotation() != null && result.getMoveNotation().startsWith("ERROR")) {
                System.err.println("⚠️ Move rejected: " + result.getMoveNotation());
                notifyMoveError(matchId, result.getMoveNotation(), moveRequest);
            } else if (result != null) {
                System.out.println("🚀 Move processed successfully for game " + matchId);
                // Removed messagingTemplate.convertAndSend here as it's handled in Service
            }
        } catch (Exception e) {
            System.err.println("❌ CRITICAL: Error processing move: " + e.getMessage());
            notifyMoveError(matchId, "System error: " + e.getMessage(), moveRequest);
            e.printStackTrace();
        }
    }

    private void notifyMoveError(Long matchId, String error, MoveRequest originalRequest) {
        Map<String, Object> errorPayload = new HashMap<>();
        errorPayload.put("type", "MOVE_ERROR");
        errorPayload.put("error", error);
        errorPayload.put("matchId", matchId);
        errorPayload.put("originalMove", originalRequest);
        errorPayload.put("timestamp", System.currentTimeMillis());

        // Send back to the specific match topic so the frontend can handle it
        gameService.sendErrorToTopic(matchId, errorPayload);
    }

    @MessageMapping("/game/{matchId}/join")
    @SendTo("/topic/game/{matchId}")
    public GameStatusDTO handlePlayerJoin(@DestinationVariable Long matchId,
            @Payload JoinRequest joinRequest,
            Principal principal) {
        try {
            System.out.println("Player " + principal.getName() + " joining game " + matchId);
            return gameService.handlePlayerJoin(matchId, joinRequest, principal);
        } catch (Exception e) {
            System.err.println("Error handling player join: " + e.getMessage());
            GameStatusDTO errorStatus = new GameStatusDTO();
            errorStatus.setMatchId(matchId);
            errorStatus.setStatus("ERROR: " + e.getMessage());
            return errorStatus;
        }
    }

    @MessageMapping("/game/{matchId}/resign")
    @SendTo("/topic/game-state/{matchId}")
    public Map<String, Object> handleResign(@DestinationVariable Long matchId,
            Principal principal) {
        try {
            System.out.println("Player " + principal.getName() + " resigning from game " + matchId);
            gameService.handleResignation(matchId, principal.getName());

            Map<String, Object> response = new HashMap<>();
            response.put("type", "RESIGNATION");
            response.put("player", principal.getName());
            response.put("matchId", matchId);
            response.put("timestamp", System.currentTimeMillis());
            return response;
        } catch (Exception e) {
            System.err.println("Error handling resignation: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return error;
        }
    }

    @MessageMapping("/game/{matchId}/draw")
    public Map<String, Object> handleDrawOffer(@DestinationVariable Long matchId,
            Principal principal) {
        try {
            System.out.println("Player " + principal.getName() + " offering draw in game " + matchId);
            gameService.handleDrawOffer(matchId, principal.getName());

            Map<String, Object> response = new HashMap<>();
            response.put("type", "DRAW_OFFER_SENT");
            response.put("matchId", matchId);
            response.put("timestamp", System.currentTimeMillis());
            return response;
        } catch (Exception e) {
            System.err.println("Error handling draw offer: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return error;
        }
    }

    @MessageMapping("/game/{matchId}/draw/accept")
    @SendTo("/topic/game-state/{matchId}")
    public Map<String, Object> handleDrawAccept(@DestinationVariable Long matchId,
            Principal principal) {
        try {
            System.out.println("Player " + principal.getName() + " accepting draw in game " + matchId);

            Map<String, Object> response = new HashMap<>();
            response.put("type", "DRAW_ACCEPTED");
            response.put("player", principal.getName());
            response.put("matchId", matchId);
            response.put("timestamp", System.currentTimeMillis());
            response.put("status", "DRAW");
            return response;
        } catch (Exception e) {
            System.err.println("Error handling draw accept: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return error;
        }
    }

    @MessageMapping("/game/{matchId}/chat")
    @SendTo("/topic/chat/{matchId}")
    public Map<String, Object> handleChatMessage(@DestinationVariable Long matchId,
            @Payload Map<String, String> chatMessage,
            Principal principal) {
        try {
            System.out.println("Chat message from " + principal.getName() + " in game " + matchId);

            Map<String, Object> response = new HashMap<>();
            response.put("type", "CHAT_MESSAGE");
            response.put("from", principal.getName());
            response.put("message", chatMessage.get("message"));
            response.put("matchId", matchId);
            response.put("timestamp", System.currentTimeMillis());
            return response;
        } catch (Exception e) {
            System.err.println("Error handling chat message: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return error;
        }
    }

}
