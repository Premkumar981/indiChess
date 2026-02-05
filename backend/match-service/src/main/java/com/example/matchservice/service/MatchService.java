package com.example.matchservice.service;

import com.example.matchservice.model.GameType;
import com.example.matchservice.model.Match;
import com.example.matchservice.model.User;
import com.example.matchservice.repo.MatchRepo;
import com.example.matchservice.repo.UserRepo;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import static com.example.matchservice.model.MatchStatus.IN_PROGRESS;

@Service
@Transactional
public class MatchService {

    private static final Map<String, Long> waitingPlayers = new ConcurrentHashMap<>();
    private static final Map<Long, String[]> matchPlayers = new ConcurrentHashMap<>();
    private static final Map<String, String> roomWaiters = new ConcurrentHashMap<>();
    private static final String INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    private static final String LOG_FILE = "/Users/premkumar/Documents/HCL Training/indiChess/match_service_debug.log";

    private void logToFile(String message) {
        try {
            java.nio.file.Files.write(java.nio.file.Paths.get(LOG_FILE),
                    (new java.util.Date() + ": " + message + "\n").getBytes(),
                    java.nio.file.StandardOpenOption.CREATE,
                    java.nio.file.StandardOpenOption.APPEND);
        } catch (Exception e) {
            System.err.println("Failed to write to log file: " + e.getMessage());
        }
    }

    private final MatchRepo matchRepo;
    private final JwtService jwtService;
    private final UserRepo userRepo;
    private final JdbcTemplate jdbcTemplate;

    public MatchService(JwtService jwtService, UserRepo userRepo, MatchRepo matchRepo, JdbcTemplate jdbcTemplate) {
        this.jwtService = jwtService;
        this.userRepo = userRepo;
        this.matchRepo = matchRepo;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void fixSchema() {
        try {
            logToFile("🛠 Attempting to fix schema if it's using an old ENUM for game_type...");
            jdbcTemplate.execute("ALTER TABLE matches MODIFY COLUMN game_type VARCHAR(20)");
            logToFile("✅ Schema fix attempted successfully");
        } catch (Exception e) {
            logToFile("ℹ️ Schema fix skipped or failed (might be fine): " + e.getMessage());
        }
    }

    public String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        String tokenFromHeader = null;

        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            tokenFromHeader = bearerToken.substring(7).trim();
            if (!tokenFromHeader.isEmpty() && !"null".equalsIgnoreCase(tokenFromHeader)
                    && !"undefined".equalsIgnoreCase(tokenFromHeader)) {
                logToFile("✅ Found token in Authorization header (length: " + tokenFromHeader.length() + ")");
                // Check if it looks like a JWT (at least one dot for now, ideally 2)
                if (tokenFromHeader.contains(".")) {
                    return tokenFromHeader;
                } else {
                    logToFile("⚠️ Token in header doesn't look like a JWT, checking cookies...");
                }
            } else {
                logToFile("⚠️ Authorization header found but token is empty or invalid ('" + tokenFromHeader + "')");
            }
        }

        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("JWT".equals(cookie.getName())) {
                    String cookieVal = cookie.getValue();
                    logToFile("✅ Found JWT cookie (length: " + cookieVal.length() + ")");
                    return cookieVal;
                }
            }
        }

        if (tokenFromHeader != null && !tokenFromHeader.isEmpty()) {
            logToFile("👉 Falling back to invalid header token as last resort");
            return tokenFromHeader;
        }

        logToFile("❌ No token found in header or cookies");
        return null;
    }

    public Optional<Long> createMatch(HttpServletRequest request) {
        String tk = extractToken(request);
        if (tk == null) {
            return Optional.empty();
        }
        String userName = jwtService.extractUsername(tk);

        if (userName == null) {
            return Optional.empty();
        }

        System.out.println("User " + userName + " requesting match");

        synchronized (this) {
            System.out.println("Wait queue state before matching: " + waitingPlayers.keySet());
            for (String waitingPlayer : waitingPlayers.keySet()) {
                if (!waitingPlayer.equals(userName)) {
                    System.out.println("Pairing " + userName + " with " + waitingPlayer);
                    User player1 = userRepo.getUserByUsername(waitingPlayer);
                    User player2 = userRepo.getUserByUsername(userName);

                    if (player1 != null && player2 != null) {
                        Match newMatch = new Match(player1, player2, IN_PROGRESS, 0);
                        newMatch.setFenCurrent(INITIAL_FEN);
                        newMatch = matchRepo.save(newMatch);
                        Long matchId = newMatch.getId();

                        matchPlayers.put(matchId, new String[] { waitingPlayer, userName });
                        waitingPlayers.remove(waitingPlayer);
                        waitingPlayers.remove(userName); // Ensure creator is also out of the queue

                        System.out.println("Match created successfully: " + matchId + " between " + waitingPlayer
                                + " and " + userName);
                        // Game initialization logic...
                        return Optional.of(matchId);
                    } else {
                        System.out.println("Failed to load user(s) from DB: " + waitingPlayer + " or " + userName);
                    }
                }
            }

            if (!waitingPlayers.containsKey(userName)) {
                waitingPlayers.put(userName, System.currentTimeMillis());
                System.out.println("User " + userName + " added to waiting queue. Queue: " + waitingPlayers.keySet());
            } else {
                System.out.println("User " + userName + " already in queue.");
            }

            return Optional.of(-1L);
        }
    }

    public String createRoom(HttpServletRequest request) {
        String token = extractToken(request);
        if (token == null)
            return null;
        String username = jwtService.extractUsername(token);
        if (username == null)
            return null;

        String roomCode = generateRoomCode();
        roomWaiters.put(roomCode, username);
        logToFile("🏠 Room created: " + roomCode + " by " + username);
        return roomCode;
    }

    public Optional<Long> joinRoom(String roomCode, HttpServletRequest request) {
        String token = extractToken(request);
        if (token == null)
            return Optional.empty();
        String joinerName = jwtService.extractUsername(token);
        if (joinerName == null)
            return Optional.empty();

        String creatorName = roomWaiters.remove(roomCode);
        if (creatorName == null) {
            logToFile("❌ Room " + roomCode + " not found or already joined");
            return Optional.empty();
        }

        if (creatorName.equals(joinerName)) {
            // Put it back if same user tries to join (though frontend should prevent this)
            roomWaiters.put(roomCode, creatorName);
            return Optional.empty();
        }

        logToFile("🤝 User " + joinerName + " joining room " + roomCode + " created by " + creatorName);

        User creator = userRepo.getUserByUsername(creatorName);
        User joiner = userRepo.getUserByUsername(joinerName);

        if (creator != null && joiner != null) {
            Match newMatch = new Match(creator, joiner, IN_PROGRESS, 0);
            newMatch.setFenCurrent(INITIAL_FEN);
            newMatch.setGameType(GameType.FRIEND); // Use a specific type for Friend matches
            newMatch = matchRepo.save(newMatch);
            Long matchId = newMatch.getId();

            matchPlayers.put(matchId, new String[] { creatorName, joinerName });

            logToFile("✅ Friend match created: " + matchId + " via room " + roomCode);
            return Optional.of(matchId);
        }

        return Optional.empty();
    }

    private String generateRoomCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars 1, I, 0, O
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    public Optional<Long> createBotMatch(HttpServletRequest request) {
        try {
            String tk = extractToken(request);
            if (tk == null) {
                logToFile("❌ Cannot create bot match: Token is null");
                return Optional.empty();
            }
            String userName = jwtService.extractUsername(tk);
            if (userName == null) {
                logToFile("❌ Cannot create bot match: Username extraction from token failed");
                return Optional.empty();
            }

            logToFile("🤖 Creating bot match for user: " + userName);

            User humanPlayer = userRepo.getUserByUsername(userName);
            if (humanPlayer == null) {
                logToFile("❌ Human player not found in database: " + userName);
                return Optional.empty();
            }
            User botPlayer = userRepo.getUserByUsername("Curler");

            if (botPlayer == null) {
                logToFile("🛠 Creating new bot user: Curler");
                botPlayer = new User();
                botPlayer.setUsername("Curler");
                botPlayer.setPassword("");
                botPlayer.setEmailId("bot_curler@indichess.com");
                botPlayer.setRating(350);
                botPlayer = userRepo.save(botPlayer);
            }

            Match newMatch = new Match(humanPlayer, botPlayer, IN_PROGRESS, 0);
            newMatch.setFenCurrent(INITIAL_FEN);
            newMatch.setGameType(GameType.BOT);
            newMatch = matchRepo.save(newMatch);

            logToFile("✅ Bot match created: " + newMatch.getId() + " for " + userName);
            return Optional.of(newMatch.getId());
        } catch (Exception e) {
            logToFile("❌ CRITICAL ERROR in createBotMatch: " + e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<Long> checkMatch(HttpServletRequest request) {
        String tk = extractToken(request);
        if (tk == null) {
            return Optional.empty();
        }
        String userName = jwtService.extractUsername(tk);

        if (userName == null) {
            return Optional.empty();
        }

        synchronized (this) {
            if (waitingPlayers.containsKey(userName)) {
                return Optional.of(-1L);
            }

            for (Map.Entry<Long, String[]> entry : matchPlayers.entrySet()) {
                String[] players = entry.getValue();
                // ONLY allow the waiter (players[0]) to find and remove the match entry.
                // The creator (players[1]) already has the matchId from the createMatch
                // response.
                if (players[0].equals(userName)) {
                    Long matchId = entry.getKey();
                    matchPlayers.remove(matchId);
                    waitingPlayers.remove(players[0]);
                    waitingPlayers.remove(players[1]);
                    System.out.println("Returning match " + matchId + " to waiter " + userName);
                    return Optional.of(matchId);
                } else if (players[1].equals(userName)) {
                    // Creator already has the ID, but if they poll, we find it without removing
                    return Optional.of(entry.getKey());
                }
            }
        }

        return Optional.empty();
    }

    public boolean cancelWaiting(HttpServletRequest request) {
        String tk = extractToken(request);
        if (tk == null) {
            return false;
        }
        String userName = jwtService.extractUsername(tk);

        if (userName == null) {
            return false;
        }

        synchronized (this) {
            boolean removed = waitingPlayers.remove(userName) != null;
            if (removed) {
                System.out.println("User " + userName + " cancelled waiting");
            }
            return removed;
        }
    }

    private Map<String, Object> createPlayerInfo(User user) {
        Map<String, Object> playerInfo = new HashMap<>();
        playerInfo.put("id", user.getUserId());
        playerInfo.put("username", user.getUsername());
        return playerInfo;
    }

    private boolean determineIfMyTurn(Match match, boolean isPlayer1) {
        Integer currentPly = match.getCurrentPly();
        if (currentPly == null) {
            currentPly = 0;
        }

        boolean isWhiteTurn = currentPly % 2 == 0;
        return (isPlayer1 && isWhiteTurn) || (!isPlayer1 && !isWhiteTurn);
    }

    public Map<String, Object> getGameDetailsForFrontend(Long matchId, HttpServletRequest request) {
        String token = extractToken(request);
        if (token == null) {
            throw new RuntimeException("Not authenticated");
        }

        String username = jwtService.extractUsername(token);
        if (username == null) {
            throw new RuntimeException("Invalid token");
        }

        Optional<Match> matchOpt = matchRepo.findById(matchId);
        if (matchOpt.isEmpty()) {
            throw new RuntimeException("Game not found");
        }

        Match match = matchOpt.get();

        User player1 = match.getPlayer1();
        User player2 = match.getPlayer2();

        boolean isPlayer1 = player1.getUsername().equals(username);
        boolean isPlayer2 = player2 != null && player2.getUsername().equals(username);

        if (!isPlayer1 && !isPlayer2) {
            throw new RuntimeException("Not authorized to view this game");
        }

        String playerColor = isPlayer1 ? "white" : "black";
        boolean isMyTurn = determineIfMyTurn(match, isPlayer1);

        Map<String, Object> response = new HashMap<>();
        response.put("matchId", match.getId());
        response.put("player1", createPlayerInfo(player1));

        if (player2 != null) {
            response.put("player2", createPlayerInfo(player2));
        }

        response.put("status", match.getStatus() != null ? match.getStatus().toString() : "IN_PROGRESS");
        response.put("playerColor", playerColor);
        response.put("myTurn", isMyTurn);
        response.put("createdAt", match.getCreatedAt());
        response.put("startedAt", match.getStartedAt());
        Integer currentPlyCount = match.getCurrentPly();
        int currentPly = (currentPlyCount != null) ? currentPlyCount : 0;
        boolean whiteTurn = currentPly % 2 == 0;

        // Convert FEN to board for the frontend
        response.put("whiteTurn", whiteTurn);
        response.put("board", convertFENToBoard(match.getFenCurrent()));

        // Add move history
        List<Map<String, Object>> movesList = new ArrayList<>();
        if (match.getMoves() != null) {
            for (com.example.matchservice.model.Move move : match.getMoves()) {
                Map<String, Object> moveMap = new HashMap<>();
                moveMap.put("fromRow", move.getFromRow());
                moveMap.put("fromCol", move.getFromCol());
                moveMap.put("toRow", move.getToRow());
                moveMap.put("toCol", move.getToCol());
                moveMap.put("piece", move.getPiece());
                moveMap.put("playerColor", move.getColor().name().toLowerCase());
                moveMap.put("moveNotation", move.getSan());
                moveMap.put("isWhiteTurn", move.getColor().name().equals("BLACK")); // Turn after move
                movesList.add(moveMap);
            }
        }
        response.put("moves", movesList);

        return response;
    }

    private String[][] convertFENToBoard(String fen) {
        if (fen == null || fen.isEmpty())
            return getInitialBoard();

        String[][] board = new String[8][8];
        for (int i = 0; i < 8; i++) {
            for (int j = 0; j < 8; j++) {
                board[i][j] = "";
            }
        }

        try {
            String[] parts = fen.split(" ");
            String ranks = parts[0];
            String[] rankLines = ranks.split("/");

            for (int row = 0; row < 8; row++) {
                String rankLine = rankLines[row];
                int col = 0;
                for (int i = 0; i < rankLine.length(); i++) {
                    char c = rankLine.charAt(i);
                    if (Character.isDigit(c)) {
                        col += Character.getNumericValue(c);
                    } else {
                        board[row][col] = String.valueOf(c);
                        col++;
                    }
                }
            }
        } catch (Exception e) {
            logToFile("⚠️ Error parsing FEN for frontend: " + e.getMessage());
            return getInitialBoard();
        }
        return board;
    }

    private String[][] getInitialBoard() {
        String[][] board = new String[8][8];
        // Standard initial position
        String[] setup = { "rnbqkbnr", "pppppppp", "", "", "", "", "PPPPPPPP", "RNBQKBNR" };
        for (int r = 0; r < 8; r++) {
            String line = setup[r];
            if (line.isEmpty()) {
                for (int c = 0; c < 8; c++)
                    board[r][c] = "";
            } else {
                for (int c = 0; c < 8; c++)
                    board[r][c] = String.valueOf(line.charAt(c));
            }
        }
        return board;
    }
}
