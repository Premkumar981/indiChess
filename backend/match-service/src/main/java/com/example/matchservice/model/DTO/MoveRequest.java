package com.example.matchservice.model.DTO;

public class MoveRequest {
    private Integer fromRow;
    private Integer fromCol;
    private Integer toRow;
    private Integer toCol;
    private String piece;
    private String promotedTo;
    private String capturedPiece;
    private Boolean castled;
    private Boolean isEnPassant;
    private Boolean isPromotion;
    private String fenBefore;
    private String fenAfter;
    private String[][] board;
    private Boolean isWhiteTurn;
    private String playerColor;
    private Long matchId;
    private String timestamp;

    public MoveRequest() {
    }

    public MoveRequest(Integer fromRow, Integer fromCol, Integer toRow, Integer toCol, String piece, String promotedTo,
            String capturedPiece, Boolean castled, Boolean isEnPassant, Boolean isPromotion, String fenBefore,
            String fenAfter, String[][] board, Boolean isWhiteTurn, String playerColor, Long matchId,
            String timestamp) {
        this.fromRow = fromRow;
        this.fromCol = fromCol;
        this.toRow = toRow;
        this.toCol = toCol;
        this.piece = piece;
        this.promotedTo = promotedTo;
        this.capturedPiece = capturedPiece;
        this.castled = castled;
        this.isEnPassant = isEnPassant;
        this.isPromotion = isPromotion;
        this.fenBefore = fenBefore;
        this.fenAfter = fenAfter;
        this.board = board;
        this.isWhiteTurn = isWhiteTurn;
        this.playerColor = playerColor;
        this.matchId = matchId;
        this.timestamp = timestamp;
    }

    public Integer getFromRow() {
        return fromRow;
    }

    public void setFromRow(Integer fromRow) {
        this.fromRow = fromRow;
    }

    public Integer getFromCol() {
        return fromCol;
    }

    public void setFromCol(Integer fromCol) {
        this.fromCol = fromCol;
    }

    public Integer getToRow() {
        return toRow;
    }

    public void setToRow(Integer toRow) {
        this.toRow = toRow;
    }

    public Integer getToCol() {
        return toCol;
    }

    public void setToCol(Integer toCol) {
        this.toCol = toCol;
    }

    public String getPiece() {
        return piece;
    }

    public void setPiece(String piece) {
        this.piece = piece;
    }

    public String getPromotedTo() {
        return promotedTo;
    }

    public void setPromotedTo(String promotedTo) {
        this.promotedTo = promotedTo;
    }

    public String getCapturedPiece() {
        return capturedPiece;
    }

    public void setCapturedPiece(String capturedPiece) {
        this.capturedPiece = capturedPiece;
    }

    public Boolean getCastled() {
        return castled;
    }

    public void setCastled(Boolean castled) {
        this.castled = castled;
    }

    public Boolean getIsEnPassant() {
        return isEnPassant;
    }

    public void setIsEnPassant(Boolean isEnPassant) {
        this.isEnPassant = isEnPassant;
    }

    public Boolean getIsPromotion() {
        return isPromotion;
    }

    public void setIsPromotion(Boolean isPromotion) {
        this.isPromotion = isPromotion;
    }

    public String getFenBefore() {
        return fenBefore;
    }

    public void setFenBefore(String fenBefore) {
        this.fenBefore = fenBefore;
    }

    public String getFenAfter() {
        return fenAfter;
    }

    public void setFenAfter(String fenAfter) {
        this.fenAfter = fenAfter;
    }

    public String[][] getBoard() {
        return board;
    }

    public void setBoard(String[][] board) {
        this.board = board;
    }

    public Boolean getIsWhiteTurn() {
        return isWhiteTurn;
    }

    public void setIsWhiteTurn(Boolean isWhiteTurn) {
        this.isWhiteTurn = isWhiteTurn;
    }

    public String getPlayerColor() {
        return playerColor;
    }

    public void setPlayerColor(String playerColor) {
        this.playerColor = playerColor;
    }

    public Long getMatchId() {
        return matchId;
    }

    public void setMatchId(Long matchId) {
        this.matchId = matchId;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
