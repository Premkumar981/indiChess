package com.example.matchservice.service;

import com.example.matchservice.model.DTO.MoveDTO;
import com.example.matchservice.model.DTO.MoveRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class BotService {

    private final Random random = new Random();

    public MoveRequest generateMove(String[][] board, boolean isWhiteTurn) {
        List<MoveRequest> pseudoLegalMoves = getAllPseudoLegalMoves(board, isWhiteTurn);
        List<MoveRequest> legalMoves = new ArrayList<>();

        for (MoveRequest move : pseudoLegalMoves) {
            if (isKingSafeAfterMove(board, move, isWhiteTurn)) {
                legalMoves.add(move);
            }
        }

        if (legalMoves.isEmpty()) {
            return null;
        }

        // Simple bot: pick a random legal move
        return legalMoves.get(random.nextInt(legalMoves.size()));
    }

    private boolean isKingSafeAfterMove(String[][] board, MoveRequest move, boolean isWhite) {
        // Clone board and apply move
        String[][] tempBoard = new String[8][8];
        for (int i = 0; i < 8; i++) {
            tempBoard[i] = board[i].clone();
        }

        tempBoard[move.getToRow()][move.getToCol()] = move.getPiece();
        tempBoard[move.getFromRow()][move.getFromCol()] = "";

        // Find king
        char kingChar = isWhite ? 'K' : 'k';
        int kr = -1, kc = -1;
        for (int r = 0; r < 8; r++) {
            for (int c = 0; c < 8; c++) {
                if (tempBoard[r][c].length() > 0 && tempBoard[r][c].charAt(0) == kingChar) {
                    kr = r;
                    kc = c;
                    break;
                }
            }
            if (kr != -1)
                break;
        }

        if (kr == -1)
            return true; // Should not happen

        // Check if any opponent piece can attack the king
        return !isSquareAttacked(tempBoard, kr, kc, !isWhite);
    }

    private boolean isSquareAttacked(String[][] board, int row, int col, boolean attackerIsWhite) {
        // This is a simplified version of check detection
        // 1. Check for pawns
        int pawnDir = attackerIsWhite ? 1 : -1; // Opponent's pawn direction
        char opponentPawn = attackerIsWhite ? 'P' : 'p';
        int pr = row + pawnDir;
        if (isValid(pr, col - 1) && board[pr][col - 1].length() > 0 && board[pr][col - 1].charAt(0) == opponentPawn)
            return true;
        if (isValid(pr, col + 1) && board[pr][col + 1].length() > 0 && board[pr][col + 1].charAt(0) == opponentPawn)
            return true;

        // 2. Check for knights
        int[][] knightMoves = { { -2, -1 }, { -2, 1 }, { 2, -1 }, { 2, 1 }, { -1, -2 }, { -1, 2 }, { 1, -2 },
                { 1, 2 } };
        char opponentKnight = attackerIsWhite ? 'N' : 'n';
        for (int[] m : knightMoves) {
            int nr = row + m[0], nc = col + m[1];
            if (isValid(nr, nc) && board[nr][nc].length() > 0 && board[nr][nc].charAt(0) == opponentKnight)
                return true;
        }

        // 3. Sliding pieces (Rook, Bishop, Queen)
        int[][] slidingDirs = {
                { -1, 0 }, { 1, 0 }, { 0, -1 }, { 0, 1 }, // Rook/Queen
                { -1, -1 }, { -1, 1 }, { 1, -1 }, { 1, 1 } // Bishop/Queen
        };
        for (int i = 0; i < 8; i++) {
            int dr = slidingDirs[i][0], dc = slidingDirs[i][1];
            for (int step = 1; step < 8; step++) {
                int nr = row + dr * step, nc = col + dc * step;
                if (!isValid(nr, nc))
                    break;
                String piece = board[nr][nc];
                if (!piece.isEmpty()) {
                    char p = piece.charAt(0);
                    boolean isOpponent = isUpperCase(p) == attackerIsWhite;
                    if (isOpponent) {
                        char type = Character.toLowerCase(p);
                        if (i < 4) { // Straight
                            if (type == 'r' || type == 'q')
                                return true;
                        } else { // Diagonal
                            if (type == 'b' || type == 'q')
                                return true;
                        }
                    }
                    break; // Blocked by any piece
                }
            }
        }

        // 4. King
        int[][] kingMoves = { { -1, -1 }, { -1, 0 }, { -1, 1 }, { 0, -1 }, { 0, 1 }, { 1, -1 }, { 1, 0 }, { 1, 1 } };
        char opponentKing = attackerIsWhite ? 'K' : 'k';
        for (int[] m : kingMoves) {
            int nr = row + m[0], nc = col + m[1];
            if (isValid(nr, nc) && board[nr][nc].length() > 0 && board[nr][nc].charAt(0) == opponentKing)
                return true;
        }

        return false;
    }

    private boolean isUpperCase(char c) {
        return Character.isUpperCase(c);
    }

    private List<MoveRequest> getAllPseudoLegalMoves(String[][] board, boolean isWhite) {
        List<MoveRequest> moves = new ArrayList<>();
        for (int r = 0; r < 8; r++) {
            for (int c = 0; c < 8; c++) {
                String piece = board[r][c];
                if (piece != null && !piece.isEmpty()) {
                    boolean isPieceWhite = Character.isUpperCase(piece.charAt(0));
                    if (isPieceWhite == isWhite) {
                        moves.addAll(getPseudoLegalMovesForPiece(piece, r, c, board));
                    }
                }
            }
        }
        return moves;
    }

    private List<MoveRequest> getPseudoLegalMovesForPiece(String piece, int row, int col, String[][] board) {
        List<MoveRequest> moves = new ArrayList<>();
        char type = Character.toLowerCase(piece.charAt(0));
        boolean isWhite = Character.isUpperCase(piece.charAt(0));
        int dir = isWhite ? -1 : 1;

        switch (type) {
            case 'p':
                // Forward
                if (isValid(row + dir, col) && board[row + dir][col].isEmpty()) {
                    moves.add(createMove(piece, row, col, row + dir, col, board));
                    // Double move
                    if ((isWhite && row == 6) || (!isWhite && row == 1)) {
                        if (isValid(row + 2 * dir, col) && board[row + 2 * dir][col].isEmpty()) {
                            moves.add(createMove(piece, row, col, row + 2 * dir, col, board));
                        }
                    }
                }
                // Captures
                for (int dc : new int[] { -1, 1 }) {
                    if (isValid(row + dir, col + dc)) {
                        String target = board[row + dir][col + dc];
                        if (!target.isEmpty() && Character.isUpperCase(target.charAt(0)) != isWhite) {
                            moves.add(createMove(piece, row, col, row + dir, col + dc, board));
                        }
                    }
                }
                break;
            case 'n':
                int[][] knightMoves = { { -2, -1 }, { -2, 1 }, { 2, -1 }, { 2, 1 }, { -1, -2 }, { -1, 2 }, { 1, -2 },
                        { 1, 2 } };
                for (int[] m : knightMoves) {
                    addIfValid(piece, row, col, row + m[0], col + m[1], board, moves);
                }
                break;
            case 'b':
                addSlidingMoves(piece, row, col, new int[][] { { -1, -1 }, { -1, 1 }, { 1, -1 }, { 1, 1 } }, board,
                        moves);
                break;
            case 'r':
                addSlidingMoves(piece, row, col, new int[][] { { -1, 0 }, { 1, 0 }, { 0, -1 }, { 0, 1 } }, board,
                        moves);
                break;
            case 'q':
                addSlidingMoves(piece, row, col, new int[][] { { -1, -1 }, { -1, 1 }, { 1, -1 }, { 1, 1 }, { -1, 0 },
                        { 1, 0 }, { 0, -1 }, { 0, 1 } }, board, moves);
                break;
            case 'k':
                int[][] kingMoves = { { -1, -1 }, { -1, 0 }, { -1, 1 }, { 0, -1 }, { 0, 1 }, { 1, -1 }, { 1, 0 },
                        { 1, 1 } };
                for (int[] m : kingMoves) {
                    addIfValid(piece, row, col, row + m[0], col + m[1], board, moves);
                }
                break;
        }
        return moves;
    }

    private void addSlidingMoves(String piece, int row, int col, int[][] dirs, String[][] board,
            List<MoveRequest> moves) {
        boolean isWhite = Character.isUpperCase(piece.charAt(0));
        for (int[] d : dirs) {
            for (int i = 1; i < 8; i++) {
                int nr = row + d[0] * i;
                int nc = col + d[1] * i;
                if (!isValid(nr, nc))
                    break;
                if (board[nr][nc].isEmpty()) {
                    moves.add(createMove(piece, row, col, nr, nc, board));
                } else {
                    if (Character.isUpperCase(board[nr][nc].charAt(0)) != isWhite) {
                        moves.add(createMove(piece, row, col, nr, nc, board));
                    }
                    break;
                }
            }
        }
    }

    private void addIfValid(String piece, int fr, int fc, int tr, int tc, String[][] board, List<MoveRequest> moves) {
        if (isValid(tr, tc)) {
            if (board[tr][tc].isEmpty()
                    || Character.isUpperCase(board[tr][tc].charAt(0)) != Character.isUpperCase(piece.charAt(0))) {
                moves.add(createMove(piece, fr, fc, tr, tc, board));
            }
        }
    }

    private boolean isValid(int r, int c) {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    }

    private MoveRequest createMove(String piece, int fr, int fc, int tr, int tc, String[][] board) {
        MoveRequest move = new MoveRequest();
        move.setPiece(piece);
        move.setFromRow(fr);
        move.setFromCol(fc);
        move.setToRow(tr);
        move.setToCol(tc);
        move.setPlayerColor(Character.isUpperCase(piece.charAt(0)) ? "white" : "black");

        // Clone board and apply move
        String[][] newBoard = new String[8][8];
        for (int i = 0; i < 8; i++) {
            newBoard[i] = board[i].clone();
        }
        String captured = newBoard[tr][tc];
        newBoard[tr][tc] = piece;
        newBoard[fr][fc] = "";

        move.setBoard(newBoard);
        move.setCapturedPiece(captured.isEmpty() ? null : captured);
        return move;
    }
}
