package com.example.matchservice.model.DTO;

import java.time.LocalDateTime;

public class JoinRequest {
    private String type;
    private String playerColor;
    private LocalDateTime timestamp;

    public JoinRequest() {
    }

    public JoinRequest(String type, String playerColor, LocalDateTime timestamp) {
        this.type = type;
        this.playerColor = playerColor;
        this.timestamp = timestamp;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getPlayerColor() {
        return playerColor;
    }

    public void setPlayerColor(String playerColor) {
        this.playerColor = playerColor;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
