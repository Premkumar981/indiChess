package com.example.matchservice.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "matches")
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "player1_id", nullable = false)
    private User player1;

    @ManyToOne
    @JoinColumn(name = "player2_id", nullable = false)
    private User player2;

    @Enumerated(EnumType.STRING)
    private MatchStatus status;

    private Integer currentPly;

    @Column(name = "fen_current", length = 200)
    private String fenCurrent;

    @Column(name = "last_move_uci", length = 10)
    private String lastMoveUci;

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("ply ASC")
    private List<Move> moves = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private GameType gameType;

    @PastOrPresent
    private LocalDateTime startedAt;

    @FutureOrPresent
    private LocalDateTime finishedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @PastOrPresent
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Match(User player1, User player2, MatchStatus matchStatus, int i) {
        this.player1 = player1;
        this.player2 = player2;
        this.status = matchStatus;
        this.currentPly = i;
        this.createdAt = LocalDateTime.now();
        this.startedAt = LocalDateTime.now();
    }

    public Match() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getPlayer1() {
        return player1;
    }

    public void setPlayer1(User player1) {
        this.player1 = player1;
    }

    public User getPlayer2() {
        return player2;
    }

    public void setPlayer2(User player2) {
        this.player2 = player2;
    }

    public MatchStatus getStatus() {
        return status;
    }

    public void setStatus(MatchStatus status) {
        this.status = status;
    }

    public Integer getCurrentPly() {
        return currentPly;
    }

    public void setCurrentPly(Integer currentPly) {
        this.currentPly = currentPly;
    }

    public String getFenCurrent() {
        return fenCurrent;
    }

    public void setFenCurrent(String fenCurrent) {
        this.fenCurrent = fenCurrent;
    }

    public String getLastMoveUci() {
        return lastMoveUci;
    }

    public void setLastMoveUci(String lastMoveUci) {
        this.lastMoveUci = lastMoveUci;
    }

    public List<Move> getMoves() {
        return moves;
    }

    public void setMoves(List<Move> moves) {
        this.moves = moves;
    }

    public GameType getGameType() {
        return gameType;
    }

    public void setGameType(GameType gameType) {
        this.gameType = gameType;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(LocalDateTime finishedAt) {
        this.finishedAt = finishedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.startedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
