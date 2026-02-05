package com.example.matchservice.service;

import com.example.matchservice.model.*;
import com.example.matchservice.model.DTO.*;
import com.example.matchservice.repo.MatchRepo;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Transactional
public class GameService {

    private final MatchRepo matchRepo;
    private final JwtService jwtService;
    private final SimpMessagingTemplate messagingTemplate;
    private final BotService botService;

    public GameService(MatchRepo matchRepo, JwtService jwtService,
            SimpMessagingTemplate messagingTemplate, BotService botService) {
        this.matchRepo = matchRepo;
        this.jwtService = jwtService;
        this.messagingTemplate = messagingTemplate;
        this.botService = botService;
    }

    private final Map<Long, GameState> activeGames = new ConcurrentHashMap<>();
    private final Map<Long, List<String>> gamePlayers = new ConcurrentHashMap<>();

    private static class GameState {
        private String[][] board;
        private boolean isWhiteTurn;
        private String status;
        private String player1Username;
        private String player2Username;

        public GameState() {
        }

        public String[][] getBoard() {
            return board;
        }

        public void setBoard(String[][] board) {
            this.board = board;
        }

        public boolean isWhiteTurn() {
            return isWhiteTurn;
        }

        public void setWhiteTurn(boolean whiteTurn) {
            isWhiteTurn = whiteTurn;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getPlayer1Username() {
            return player1Username;
        }

        public void setPlayer1Username(String player1Username) {
            this.player1Username = player1Username;
        }

        public String getPlayer2Username() {
            return player2Username;
        }

        public void setPlayer2Username(String player2Username) {
            this.player2Username = player2Username;
        }
    }

    public GameDTO getGameDetails(Long matchId, HttpServletRequest request) {
        String username = getUsernameFromRequest(request);
        if (username == null) {
            throw new RuntimeException("User not authenticated");
        }

        Optional<Match> matchOpt = matchRepo.findById(matchId);
        if (matchOpt.isEmpty()) {
            throw new RuntimeException("Game not found");
        }

        Match match = matchOpt.get();
        String playerColor = determinePlayerColor(match, username);
        boolean isMyTurn = determineMyTurn(match, username);

        GameState gameState = activeGames.get(matchId);
        if (gameState == null) {
            gameState = initializeGameState(match);
            activeGames.put(matchId, gameState);

            List<String> players = new ArrayList<>();
            players.add(match.getPlayer1().getUsername());
            players.add(match.getPlayer2().getUsername());
            gamePlayers.put(matchId, players);
        }

        GameDTO gameDTO = new GameDTO();
        gameDTO.setId(match.getId());
        gameDTO.setPlayer1(match.getPlayer1());
        gameDTO.setPlayer2(match.getPlayer2());
        gameDTO.setStatus(gameState.getStatus());
        gameDTO.setPlayerColor(playerColor);
        gameDTO.setMyTurn(isMyTurn);
        gameDTO.setWhiteTurn(gameState.isWhiteTurn());
        gameDTO.setBoard(gameState.getBoard());
        gameDTO.setFen(convertBoardToFEN(gameState.getBoard(), gameState.isWhiteTurn()));
        gameDTO.setMoves(match.getMoves().stream()
                .map(this::convertToMoveDTO)
                .collect(Collectors.toList()));
        gameDTO.setCreatedAt(match.getCreatedAt());
        gameDTO.setUpdatedAt(match.getUpdatedAt());

        return gameDTO;
    }

    private String determinePlayerColor(Match match, String username) {
        if (match.getPlayer1().getUsername().equals(username)) {
            return "white";
        } else if (match.getPlayer2().getUsername().equals(username)) {
            return "black";
        }
        throw new RuntimeException("User not part of this game");
    }

    private boolean determineMyTurn(Match match, String username) {
        GameState gameState = activeGames.get(match.getId());
        if (gameState == null) {
            return match.getPlayer1().getUsername().equals(username);
        }

        boolean isWhiteTurn = gameState.isWhiteTurn();
        if (isWhiteTurn) {
            return match.getPlayer1().getUsername().equals(username);
        } else {
            return match.getPlayer2().getUsername().equals(username);
        }
    }

    private GameState initializeGameState(Match match) {
        String fen = match.getFenCurrent();
        String[][] board;
        boolean isWhiteTurn = true;

        if (fen != null && !fen.isEmpty()) {
            try {
                board = convertFENToBoard(fen);
                isWhiteTurn = isWhiteTurnFromFEN(fen);
            } catch (Exception e) {
                System.err.println("⚠️ Failed to parse FEN: " + fen + ". Using initial board.");
                board = getInitialBoard();
            }
        } else {
            board = getInitialBoard();
        }

        GameState gameState = new GameState();
        gameState.setBoard(board);
        gameState.setWhiteTurn(isWhiteTurn);
        gameState.setStatus("IN_PROGRESS");
        gameState.setPlayer1Username(match.getPlayer1().getUsername());
        gameState.setPlayer2Username(match.getPlayer2().getUsername());

        return gameState;
    }

    private String[][] getInitialBoard() {
        return new String[][] {
                { "r", "n", "b", "q", "k", "b", "n", "r" },
                { "p", "p", "p", "p", "p", "p", "p", "p" },
                { "", "", "", "", "", "", "", "" },
                { "", "", "", "", "", "", "", "" },
                { "", "", "", "", "", "", "", "" },
                { "", "", "", "", "", "", "", "" },
                { "P", "P", "P", "P", "P", "P", "P", "P" },
                { "R", "N", "B", "Q", "K", "B", "N", "R" }
        };
    }

    private String[][] convertFENToBoard(String fen) {
        String[][] board = new String[8][8];
        for (int i = 0; i < 8; i++) {
            for (int j = 0; j < 8; j++) {
                board[i][j] = "";
            }
        }

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
        return board;
    }

    private boolean isWhiteTurnFromFEN(String fen) {
        String[] parts = fen.split(" ");
        if (parts.length > 1) {
            return "w".equalsIgnoreCase(parts[1]);
        }
        return true;
    }

    public MoveDTO processMove(Long matchId, MoveRequest moveRequest, Principal principal) {
        String username = principal.getName();

        if (moveRequest.getFromRow() == null || moveRequest.getFromCol() == null ||
                moveRequest.getToRow() == null || moveRequest.getToCol() == null) {
            throw new RuntimeException("Move coordinates cannot be null");
        }

        if (moveRequest.getPiece() == null || moveRequest.getPiece().isEmpty()) {
            throw new RuntimeException("Piece cannot be null or empty");
        }

        if (moveRequest.getPlayerColor() == null) {
            throw new RuntimeException("Player color cannot be null");
        }

        GameState gameState = activeGames.get(matchId);
        if (gameState == null) {
            System.out.println("🔄 GameState null for " + matchId + ". Initializing from DB...");
            Optional<Match> matchOpt = matchRepo.findById(matchId);
            if (matchOpt.isPresent()) {
                gameState = initializeGameState(matchOpt.get());
                activeGames.put(matchId, gameState);
            } else {
                throw new RuntimeException("Game with ID " + matchId + " not found in database");
            }
        }

        boolean isWhiteTurn = gameState.isWhiteTurn();
        String expectedPlayer = isWhiteTurn ? gameState.getPlayer1Username() : gameState.getPlayer2Username();

        if (!username.equalsIgnoreCase(expectedPlayer)) {
            System.err.println("❌ Turn denied: " + username + " tried to move, but expected " + expectedPlayer);
            MoveDTO errorDto = new MoveDTO();
            errorDto.setMoveNotation("ERROR: Not your turn (Expected: " + expectedPlayer + ")");
            return errorDto;
        }

        String playerColor = moveRequest.getPlayerColor();
        if (isWhiteTurn && !"white".equals(playerColor)) {
            MoveDTO errorDto = new MoveDTO();
            errorDto.setMoveNotation("ERROR: Invalid move: White's turn but player is " + playerColor);
            return errorDto;
        }
        if (!isWhiteTurn && !"black".equals(playerColor)) {
            MoveDTO errorDto = new MoveDTO();
            errorDto.setMoveNotation("ERROR: Invalid move: Black's turn but player is " + playerColor);
            return errorDto;
        }

        String[][] newBoard = moveRequest.getBoard();
        if (newBoard == null) {
            throw new RuntimeException("Board cannot be null");
        }

        gameState.setBoard(newBoard);
        gameState.setWhiteTurn(!isWhiteTurn);
        gameState.setStatus("IN_PROGRESS");

        activeGames.put(matchId, gameState);

        try {
            updateMatchInDatabase(matchId, moveRequest);
        } catch (Exception e) {
            System.err.println("⚠️ Failed to update database: " + e.getMessage());
        }

        String moveNotation = createMoveNotation(moveRequest);

        MoveDTO moveDTO = new MoveDTO();
        moveDTO.setFromRow(moveRequest.getFromRow());
        moveDTO.setFromCol(moveRequest.getFromCol());
        moveDTO.setToRow(moveRequest.getToRow());
        moveDTO.setToCol(moveRequest.getToCol());
        moveDTO.setPiece(moveRequest.getPiece());
        moveDTO.setPromotedTo(moveRequest.getPromotedTo());
        moveDTO.setCapturedPiece(moveRequest.getCapturedPiece());
        moveDTO.setCastled(moveRequest.getCastled() != null ? moveRequest.getCastled() : false);
        moveDTO.setIsEnPassant(moveRequest.getIsEnPassant() != null ? moveRequest.getIsEnPassant() : false);
        moveDTO.setIsPromotion(moveRequest.getIsPromotion() != null ? moveRequest.getIsPromotion() : false);
        moveDTO.setFenBefore(moveRequest.getFenBefore());
        moveDTO.setFenAfter(moveRequest.getFenAfter());
        moveDTO.setBoard(newBoard);
        moveDTO.setIsWhiteTurn(!isWhiteTurn);
        moveDTO.setPlayerColor(playerColor);
        moveDTO.setMatchId(matchId);
        moveDTO.setTimestamp(LocalDateTime.now().toString());
        moveDTO.setMoveNotation(moveNotation);
        moveDTO.setPlayerUsername(username);

        messagingTemplate.convertAndSend("/topic/moves/" + matchId, moveDTO);

        // Check if it's a bot game and let bot move
        Optional<Match> matchOpt = matchRepo.findById(matchId);
        if (matchOpt.isPresent() && matchOpt.get().getGameType() == GameType.BOT) {
            String botName = matchOpt.get().getPlayer2().getUsername();
            if (botName.equals("Curler") && !moveDTO.getIsWhiteTurn()) {
                // Bot's turn (Black)
                processBotMove(matchId, newBoard, false, botName);
            }
        }

        return moveDTO;
    }

    private void processBotMove(Long matchId, String[][] currentBoard, boolean isWhiteTurn, String botName) {
        // Run bot logic in a separate thread to not block the socket
        new Thread(() -> {
            try {
                Thread.sleep(1000); // Wait 1 second for realism
                MoveRequest botMoveRequest = botService.generateMove(currentBoard, isWhiteTurn);
                if (botMoveRequest != null) {
                    botMoveRequest.setPlayerColor(isWhiteTurn ? "white" : "black");

                    MoveDTO botMoveResult = processMoveInternal(matchId, botMoveRequest, botName);
                    messagingTemplate.convertAndSend("/topic/moves/" + matchId, botMoveResult);
                }
            } catch (Exception e) {
                System.err.println("Error in bot move: " + e.getMessage());
            }
        }).start();
    }

    private MoveDTO processMoveInternal(Long matchId, MoveRequest moveRequest, String username) {
        // This is a copy of processMove but using username instead of Principal
        GameState gameState = activeGames.get(matchId);
        if (gameState == null) {
            Optional<Match> matchOpt = matchRepo.findById(matchId);
            if (matchOpt.isPresent()) {
                gameState = initializeGameState(matchOpt.get());
                activeGames.put(matchId, gameState);
            } else {
                throw new RuntimeException("Game not found");
            }
        }

        boolean currentIsWhiteTurn = gameState.isWhiteTurn();

        String[][] newBoard = moveRequest.getBoard();
        gameState.setBoard(newBoard);
        gameState.setWhiteTurn(!currentIsWhiteTurn);
        gameState.setStatus("IN_PROGRESS");
        activeGames.put(matchId, gameState);

        updateMatchInDatabase(matchId, moveRequest);
        String moveNotation = createMoveNotation(moveRequest);

        MoveDTO moveDTO = new MoveDTO();
        moveDTO.setFromRow(moveRequest.getFromRow());
        moveDTO.setFromCol(moveRequest.getFromCol());
        moveDTO.setToRow(moveRequest.getToRow());
        moveDTO.setToCol(moveRequest.getToCol());
        moveDTO.setPiece(moveRequest.getPiece());
        moveDTO.setCapturedPiece(moveRequest.getCapturedPiece());
        moveDTO.setBoard(newBoard);
        moveDTO.setIsWhiteTurn(!currentIsWhiteTurn);
        moveDTO.setPlayerColor(moveRequest.getPlayerColor());
        moveDTO.setMatchId(matchId);
        moveDTO.setTimestamp(LocalDateTime.now().toString());
        moveDTO.setMoveNotation(moveNotation);
        moveDTO.setPlayerUsername(username);

        return moveDTO;
    }

    private MoveDTO convertToMoveDTO(Move move) {
        MoveDTO dto = new MoveDTO();
        dto.setFromRow(move.getFromRow());
        dto.setFromCol(move.getFromCol());
        dto.setToRow(move.getToRow());
        dto.setToCol(move.getToCol());
        dto.setPiece(move.getPiece());
        dto.setPromotedTo(move.getPromotedTo());
        dto.setCapturedPiece(move.getCapturedPiece());
        dto.setCastled(move.getCastled());
        dto.setIsEnPassant(move.getIsEnPassant());
        dto.setIsPromotion(move.getIsPromotion());
        dto.setFenBefore(move.getFenBefore());
        dto.setFenAfter(move.getFenAfter());
        dto.setIsWhiteTurn(move.getColor() == PieceColor.WHITE);
        dto.setPlayerColor(move.getColor().name().toLowerCase());
        dto.setMatchId(move.getMatch().getId());
        dto.setTimestamp(move.getCreatedAt() != null ? move.getCreatedAt().toString() : "");
        dto.setMoveNotation(move.getSan());
        return dto;
    }

    private String createMoveNotation(MoveRequest move) {
        int toRow = move.getToRow();
        int toCol = move.getToCol();
        String piece = move.getPiece();

        String toSquare = colToFile(toCol) + (8 - toRow);

        if (Boolean.TRUE.equals(move.getCastled())) {
            return toCol == 6 ? "O-O" : "O-O-O";
        }

        String pieceSymbol = piece.toUpperCase();
        if ("p".equalsIgnoreCase(piece)) {
            pieceSymbol = "";
        }

        String capture = move.getCapturedPiece() != null && !move.getCapturedPiece().isEmpty() ? "x" : "";
        return pieceSymbol + capture + toSquare;
    }

    private String colToFile(int col) {
        return String.valueOf((char) ('a' + col));
    }

    private void updateMatchInDatabase(Long matchId, MoveRequest moveRequest) {
        try {
            Optional<Match> matchOpt = matchRepo.findById(matchId);
            if (matchOpt.isPresent()) {
                Match match = matchOpt.get();

                if (moveRequest.getFenAfter() != null) {
                    match.setFenCurrent(moveRequest.getFenAfter());
                }

                String uci = createUCI(moveRequest);
                if (!uci.isEmpty()) {
                    match.setLastMoveUci(uci);
                }

                Integer currentPly = match.getCurrentPly();
                if (currentPly == null) {
                    currentPly = 0;
                }

                // Create Move entity
                Move moveEntity = new Move();
                moveEntity.setMatch(match);
                moveEntity.setPly(currentPly + 1);
                moveEntity.setMoveNumber((currentPly / 2) + 1);
                moveEntity.setColor(
                        "white".equalsIgnoreCase(moveRequest.getPlayerColor()) ? PieceColor.WHITE : PieceColor.BLACK);
                moveEntity.setUci(uci);
                moveEntity.setSan(createMoveNotation(moveRequest));
                moveEntity.setPiece(moveRequest.getPiece());
                moveEntity.setPromotedTo(moveRequest.getPromotedTo());
                moveEntity.setCapturedPiece(moveRequest.getCapturedPiece());
                moveEntity.setCastled(moveRequest.getCastled());
                moveEntity.setIsEnPassant(moveRequest.getIsEnPassant());
                moveEntity.setIsPromotion(moveRequest.getIsPromotion());
                moveEntity.setFromRow(moveRequest.getFromRow());
                moveEntity.setFromCol(moveRequest.getFromCol());
                moveEntity.setToRow(moveRequest.getToRow());
                moveEntity.setToCol(moveRequest.getToCol());
                moveEntity.setFenBefore(moveRequest.getFenBefore());
                moveEntity.setFenAfter(moveRequest.getFenAfter());
                moveEntity.setCreatedAt(LocalDateTime.now());

                match.getMoves().add(moveEntity);
                match.setCurrentPly(currentPly + 1);

                matchRepo.save(match);
            }
        } catch (Exception e) {
            System.err.println("❌ Error updating match in database: " + e.getMessage());
        }
    }

    private String createUCI(MoveRequest move) {
        if (move.getFromCol() == null || move.getFromRow() == null ||
                move.getToCol() == null || move.getToRow() == null) {
            return "";
        }

        try {
            String fromFile = Character.toString((char) ('a' + move.getFromCol()));
            int fromRank = 8 - move.getFromRow();
            String toFile = Character.toString((char) ('a' + move.getToCol()));
            int toRank = 8 - move.getToRow();

            String uci = fromFile + fromRank + toFile + toRank;

            if (Boolean.TRUE.equals(move.getIsPromotion()) && move.getPromotedTo() != null) {
                String promotedPiece = move.getPromotedTo().toLowerCase();
                if (promotedPiece.equals("q"))
                    uci += "q";
                else if (promotedPiece.equals("r"))
                    uci += "r";
                else if (promotedPiece.equals("b"))
                    uci += "b";
                else if (promotedPiece.equals("n"))
                    uci += "n";
            }

            return uci;
        } catch (Exception e) {
            System.err.println("Error creating UCI notation: " + e.getMessage());
            return "";
        }
    }

    public GameStatusDTO handlePlayerJoin(Long matchId, JoinRequest joinRequest, Principal principal) {
        String username = principal.getName();

        GameState gameState = activeGames.get(matchId);
        if (gameState == null) {
            Optional<Match> matchOpt = matchRepo.findById(matchId);
            if (matchOpt.isPresent()) {
                gameState = initializeGameState(matchOpt.get());
                activeGames.put(matchId, gameState);
            } else {
                throw new RuntimeException("Game not found");
            }
        }

        GameStatusDTO statusDTO = new GameStatusDTO();
        statusDTO.setMatchId(matchId);
        statusDTO.setStatus(gameState.getStatus());
        statusDTO.setWhiteTurn(gameState.isWhiteTurn());

        // Trigger bot move if it's bot's turn and bot match
        if (!gameState.getStatus().contains("FINISHED")) {
            boolean isWhiteTurn = gameState.isWhiteTurn();
            String player1 = gameState.getPlayer1Username();
            String player2 = gameState.getPlayer2Username();

            boolean isBotTurn = false;
            String botName = null;

            if (isWhiteTurn && player1.equalsIgnoreCase("Curler")) {
                isBotTurn = true;
                botName = player1;
            } else if (!isWhiteTurn && player2 != null && player2.equalsIgnoreCase("Curler")) {
                isBotTurn = true;
                botName = player2;
            }

            if (isBotTurn && botName != null) {
                System.out.println("🤖 Triggering bot turn for " + botName + " on player join");
                processBotMove(matchId, gameState.getBoard(), isWhiteTurn, botName);
            }
        }

        statusDTO.setPlayerColor(joinRequest.getPlayerColor());
        statusDTO.setMyTurn(determineMyTurn(matchId, username));
        statusDTO.setBoard(gameState.getBoard());
        statusDTO.setFen(convertBoardToFEN(gameState.getBoard(), gameState.isWhiteTurn()));

        Optional<Match> matchOpt = matchRepo.findById(matchId);
        if (matchOpt.isPresent()) {
            statusDTO.setMoves(matchOpt.get().getMoves().stream()
                    .map(this::convertToMoveDTO)
                    .collect(Collectors.toList()));
        }

        statusDTO.setWhiteTurn(gameState.isWhiteTurn());
        return statusDTO;
    }

    private boolean determineMyTurn(Long matchId, String username) {
        GameState gameState = activeGames.get(matchId);
        if (gameState == null)
            return false;

        boolean isWhiteTurn = gameState.isWhiteTurn();
        if (isWhiteTurn) {
            return gameState.getPlayer1Username().equalsIgnoreCase(username);
        } else {
            return gameState.getPlayer2Username().equalsIgnoreCase(username);
        }
    }

    private String convertBoardToFEN(String[][] board, boolean isWhiteTurn) {
        StringBuilder fen = new StringBuilder();

        for (int row = 0; row < 8; row++) {
            int emptyCount = 0;
            for (int col = 0; col < 8; col++) {
                String piece = board[row][col];
                if (piece == null || piece.isEmpty()) {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fen.append(emptyCount);
                        emptyCount = 0;
                    }
                    fen.append(piece);
                }
            }
            if (emptyCount > 0) {
                fen.append(emptyCount);
            }
            if (row < 7) {
                fen.append("/");
            }
        }

        fen.append(" ").append(isWhiteTurn ? "w" : "b");
        fen.append(" ").append("KQkq");
        fen.append(" ").append("-");
        fen.append(" ").append("0 1");

        return fen.toString();
    }

    public void handleResignation(Long matchId, String username) {
        GameState gameState = activeGames.get(matchId);
        if (gameState != null) {
            gameState.setStatus("RESIGNED");
            activeGames.put(matchId, gameState);

            GameStatusDTO statusDTO = new GameStatusDTO();
            statusDTO.setMatchId(matchId);
            statusDTO.setStatus("RESIGNED");
            statusDTO.setPlayerColor(getPlayerColor(matchId, username));

            messagingTemplate.convertAndSend("/topic/game-state/" + matchId, statusDTO);
        }
    }

    public void handleDrawOffer(Long matchId, String username) {
        GameState gameState = activeGames.get(matchId);
        if (gameState != null) {
            String opponent = getOpponentUsername(matchId, username);

            Map<String, Object> drawOffer = new HashMap<>();
            drawOffer.put("type", "DRAW_OFFER");
            drawOffer.put("from", username);
            drawOffer.put("matchId", matchId);
            drawOffer.put("timestamp", LocalDateTime.now());

            messagingTemplate.convertAndSendToUser(opponent, "/queue/draw-offers", drawOffer);
        }
    }

    private String getPlayerColor(Long matchId, String username) {
        List<String> players = gamePlayers.get(matchId);
        if (players != null && players.size() >= 2) {
            if (players.get(0).equals(username)) {
                return "white";
            } else if (players.get(1).equals(username)) {
                return "black";
            }
        }
        return null;
    }

    private String getOpponentUsername(Long matchId, String username) {
        List<String> players = gamePlayers.get(matchId);
        if (players != null && players.size() >= 2) {
            if (players.get(0).equals(username)) {
                return players.get(1);
            } else if (players.get(1).equals(username)) {
                return players.get(0);
            }
        }
        return null;
    }

    private String getUsernameFromRequest(HttpServletRequest request) {
        String token = extractToken(request);
        if (token != null) {
            return jwtService.extractUsername(token);
        }
        return null;
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("JWT".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        return null;
    }

    public void sendErrorToTopic(Long matchId, Object errorPayload) {
        messagingTemplate.convertAndSend("/topic/moves/" + matchId, errorPayload);
    }
}
