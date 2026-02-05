package com.example.matchservice.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "moves", uniqueConstraints = @UniqueConstraint(columnNames = { "match_id", "ply" }))
public class Move {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    private int ply;
    private int moveNumber;

    @Enumerated(EnumType.STRING)
    private PieceColor color;

    private String uci;
    private String san;

    private String piece;
    private String promotedTo;
    private String capturedPiece;
    private Boolean castled;
    private Boolean isEnPassant;
    private Boolean isPromotion;

    private Integer fromRow;
    private Integer fromCol;
    private Integer toRow;
    private Integer toCol;

    @Column(length = 2000)
    private String fenBefore;
    @Column(length = 2000)
    private String fenAfter;

    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Match getMatch() {
        return match;
    }

    public void setMatch(Match match) {
        this.match = match;
    }

    public int getPly() {
        return ply;
    }

    public void setPly(int ply) {
        this.ply = ply;
    }

    public int getMoveNumber() {
        return moveNumber;
    }

    public void setMoveNumber(int moveNumber) {
        this.moveNumber = moveNumber;
    }

    public PieceColor getColor() {
        return color;
    }

    public void setColor(PieceColor color) {
        this.color = color;
    }

    public String getUci() {
        return uci;
    }

    public void setUci(String uci) {
        this.uci = uci;
    }

    public String getSan() {
        return san;
    }

    public void setSan(String san) {
        this.san = san;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
