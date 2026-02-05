package com.example.matchservice.model.DTO;

import java.util.List;

public class GameStatusDTO {
    private String status;
    private Long matchId;
    private String playerColor;
    private boolean isMyTurn;
    private String[][] board;
    private String fen;
    private List<MoveDTO> moves;
    private boolean isWhiteTurn;

    public GameStatusDTO() {
    }

    public GameStatusDTO(String status, Long matchId, String playerColor, boolean isMyTurn, String[][] board,
            String fen, List<MoveDTO> moves, boolean isWhiteTurn) {
        this.status = status;
        this.matchId = matchId;
        this.playerColor = playerColor;
        this.isMyTurn = isMyTurn;
        this.board = board;
        this.fen = fen;
        this.moves = moves;
        this.isWhiteTurn = isWhiteTurn;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getMatchId() {
        return matchId;
    }

    public void setMatchId(Long matchId) {
        this.matchId = matchId;
    }

    public String getPlayerColor() {
        return playerColor;
    }

    public void setPlayerColor(String playerColor) {
        this.playerColor = playerColor;
    }

    public boolean isMyTurn() {
        return isMyTurn;
    }

    public void setMyTurn(boolean myTurn) {
        isMyTurn = myTurn;
    }

    public String[][] getBoard() {
        return board;
    }

    public void setBoard(String[][] board) {
        this.board = board;
    }

    public String getFen() {
        return fen;
    }

    public void setFen(String fen) {
        this.fen = fen;
    }

    public List<MoveDTO> getMoves() {
        return moves;
    }

    public void setMoves(List<MoveDTO> moves) {
        this.moves = moves;
    }

    public boolean isWhiteTurn() {
        return isWhiteTurn;
    }

    public void setWhiteTurn(boolean whiteTurn) {
        isWhiteTurn = whiteTurn;
    }
}
