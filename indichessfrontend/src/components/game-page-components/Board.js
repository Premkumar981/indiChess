import React, { useState, useEffect, useRef } from "react";
import "../component-styles/Board.css";  // Importing CSS file
import PromotionModal from "../game-page-components/PromotionModal";
import ChessPiece from "./ChessPiece";

// MODIFICATION 1: Update props to include WebSocket functionality
const Board = ({
  addMove,
  // NEW PROPS:
  sendMove,           // Function to send move to server via WebSocket
  opponentMove,       // Move data received from opponent via WebSocket
  playerColor,        // 'white' or 'black' - which color this player is
  isMyTurn,           // Boolean - whether it's currently this player's turn
  isConnected,        // Boolean - WebSocket connection status
  matchId,             // Game match ID
  initialGameData,     // Initial game state from server
  isWhiteTurn,         // CURRENT turn from GameContainer
  gameStatus,          // Current game status from GameContainer
  setGameStatus        // Setter for game status
}) => {
  const [boardSize, setBoardSize] = useState(500); // Initial size of the board
  const [board, setBoard] = useState(initialGameData?.board || [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"]
  ]);  // Initial position of pieces
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [isSquareSelected, setIsSquareSelected] = useState(false);
  const [validMoves, setValidMoves] = useState([]);
  // MODIFICATION 2: gameStatus is now a prop

  // MODIFICATION 2: isWhiteTurn is now a prop

  // piece, prow, pcol, arow, acol
  const [allMoves, setAllMoves] = useState([]);
  const [prevAllMoves, setPrevAllMoves] = useState([]);

  const [blackKingCoordinates, setBlackKingCoordinates] = useState([0, 4]);
  const [whiteKingCoordinates, setWhiteKingCoordinates] = useState([7, 4]);
  const boardRef = useRef(null);
  const [prevMove, setPrevMove] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [promotingPawn, setPromotingPawn] = useState(null);
  // isKingInCheckHook[0] --> white king's check state
  // isKingInCheckHook[1] --> black king's check state
  const [isKingInCheckHook, setIsKingInCheckHook] = useState([false, false]);
  // castling hooks
  // kingsMoved[0] --> signifies white's king movement
  // kingsMoved[1] --> signifies black's king movement
  const [kingsMoved, setKingsMoved] = useState([false, false]);

  // rooksMoved[0] --> signifies white's king side rook's movement
  // rooksMoved[1] --> signifies white's Queen side rook's movement
  // rooksMoved[2] --> signifies black's king side rook's movement
  // rooksMoved[3] --> signifies black's queen side rook's movement
  const [rooksMoved, setRooksMoved] = useState([false, false, false, false]);

  // MODIFICATION 3: Add state for opponent's move
  const [lastOpponentMove, setLastOpponentMove] = useState(null);

  // Handle window resize
  const updateBoardSize = () => {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.6;  // 60% of the viewport size
    setBoardSize(size);
  };

  useEffect(() => {
    updateBoardSize();  // Set initial size
    window.addEventListener("resize", updateBoardSize);

    return () => {
      window.removeEventListener("resize", updateBoardSize);
    };
  }, []);

  useEffect(() => {
    const testElement = document.createElement('div');
    testElement.draggable = true;

    testElement.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('test', 'hello');
      console.log("Data set:", e.dataTransfer.getData('test'));
    });

    testElement.addEventListener('dragend', (e) => {
      console.log("Can get data after drag?", e.dataTransfer.getData('test'));
    });
  }, []);

  // Turn update effect removed - using prop directly

  useEffect(() => {
    getMovesOfPlayer();
  }, [isWhiteTurn, board]);

  useEffect(() => {
    if (initialGameData?.board) {
      console.log("🔄 Initializing/Syncing board from initialGameData");
      setBoard(initialGameData.board);

      // Update king coordinates
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (initialGameData.board[r][c] === 'K') setWhiteKingCoordinates([r, c]);
          if (initialGameData.board[r][c] === 'k') setBlackKingCoordinates([r, c]);
        }
      }
    }
  }, [initialGameData]);

  // MODIFICATION 5: Handle opponent's move from WebSocket
  // Update the validation in useEffect or applyOpponentMove:
  useEffect(() => {
    if (opponentMove) {
      const moveStr = JSON.stringify(opponentMove);
      if (moveStr === lastOpponentMove) return;

      console.log("📥 New opponent move received:", opponentMove);
      applyOpponentMove(opponentMove);
      setLastOpponentMove(moveStr);
    }
  }, [opponentMove]);

  const applyOpponentMove = (moveData) => {
    console.log("📬 Applying opponent move:", moveData);

    // Check if moveData is valid
    if (!moveData) {
      console.error("❌ moveData is undefined");
      return;
    }


    let from, to;

    if (moveData.from && moveData.to) {
      // Structure 2: Nested objects
      from = moveData.from;
      to = moveData.to;
      console.log("📋 Using nested object structure");
    } else if (moveData.fromRow !== undefined && moveData.fromCol !== undefined &&
      moveData.toRow !== undefined && moveData.toCol !== undefined) {
      // Structure 1: Flat fields
      from = { row: moveData.fromRow, col: moveData.fromCol };
      to = { row: moveData.toRow, col: moveData.toCol };
      console.log("📋 Using flat field structure");
    } else {
      console.error("❌ moveData missing coordinates:", {
        hasFromTo: !!(moveData.from && moveData.to),
        hasFlatFields: !!(moveData.fromRow !== undefined && moveData.fromCol !== undefined),
        moveData
      });
      return;
    }

    const { piece, promotedTo, capturedPiece, castled, isPromotion, isEnPassant, board: newBoardFromData, isWhiteTurn } = moveData;

    // Validate coordinates
    if (from.row === undefined || from.col === undefined ||
      to.row === undefined || to.col === undefined) {
      console.error("❌ Invalid coordinates:", { from, to });
      return;
    }

    console.log(`🎯 Opponent move: ${piece} from [${from.row},${from.col}] to [${to.row},${to.col}]`);

    // OPTION 1: If board is provided in moveData, use it directly (simpler and more reliable)
    if (newBoardFromData && Array.isArray(newBoardFromData) && newBoardFromData.length === 8) {
      console.log("✅ Using board from move data");
      setBoard(newBoardFromData);

      // Update king coordinates based on new board
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (newBoardFromData[row][col] === 'K') {
            setWhiteKingCoordinates([row, col]);
          } else if (newBoardFromData[row][col] === 'k') {
            setBlackKingCoordinates([row, col]);
          }
        }
      }

    } else {
      // OPTION 2: Apply move manually to current board
      console.log("⚠️ No board in move data, applying move manually");
      const newBoard = [...board];
      const fenBefore = convertBoardToFEN(board);

      // Handle promotion
      if (isPromotion && promotedTo) {
        console.log(`♟️ Promotion to: ${promotedTo}`);
        newBoard[to.row][to.col] = promotedTo;
      } else {
        newBoard[to.row][to.col] = piece;
      }

      newBoard[from.row][from.col] = "";

      // Handle en passant capture
      if (isEnPassant) {
        console.log("⚡ En passant capture");
        if (piece === 'p') {
          newBoard[to.row - 1][to.col] = "";
        } else if (piece === 'P') {
          newBoard[to.row + 1][to.col] = "";
        }
      }

      // Handle castling
      if (castled) {
        console.log("🏰 Castling move");
        if (piece === 'K') {
          if (to.col === 6) { // Short castle
            newBoard[7][5] = 'R';
            newBoard[7][7] = "";
          } else if (to.col === 2) { // Long castle
            newBoard[7][3] = 'R';
            newBoard[7][0] = "";
          }
        } else if (piece === 'k') {
          if (to.col === 6) { // Short castle
            newBoard[0][5] = 'r';
            newBoard[0][7] = "";
          } else if (to.col === 2) { // Long castle
            newBoard[0][3] = 'r';
            newBoard[0][0] = "";
          }
        }
      }

      // Update board
      setBoard(newBoard);

      // Update king coordinates
      if (piece === 'K') {
        setWhiteKingCoordinates([to.row, to.col]);
      } else if (piece === 'k') {
        setBlackKingCoordinates([to.row, to.col]);
      }

      // Update castling rights
      if (piece === 'K') {
        setKingsMoved([true, kingsMoved[1]]);
      } else if (piece === 'k') {
        setKingsMoved([kingsMoved[0], true]);
      }

      // Update rooks moved
      if (piece === 'R') {
        if (from.row === 7) {
          if (from.col === 0) setRooksMoved([rooksMoved[0], true, rooksMoved[2], rooksMoved[3]]);
          else if (from.col === 7) setRooksMoved([true, rooksMoved[1], rooksMoved[2], rooksMoved[3]]);
        }
      } else if (piece === 'r') {
        if (from.row === 0) {
          if (from.col === 0) setRooksMoved([rooksMoved[0], rooksMoved[1], rooksMoved[2], true]);
          else if (from.col === 7) setRooksMoved([rooksMoved[0], rooksMoved[1], true, rooksMoved[3]]);
        }
      }
    }

    // Update move history locally
    const moveNotation = moveData.moveNotation || createMoveNotation(from, to, piece, capturedPiece, castled, board);
    const fenAfter = moveData.fenAfter || convertBoardToFEN(board);
    const fenBefore = moveData.fenBefore || convertBoardToFEN(board);

    // Add to move history with more details
    const moveToAdd = {
      piece,
      moveFrom: `${String.fromCharCode('a'.charCodeAt(0) + from.col)}${8 - from.row}`,
      moveTo: `${String.fromCharCode('a'.charCodeAt(0) + to.col)}${8 - to.row}`,
      sqnumfrom: 8 - from.row,
      sqnumto: 8 - to.row,
      tc: to.col,
      tr: to.row,
      fenBefore,
      fenAfter,
      createdAt: new Date().toISOString(),
      isOpponentMove: true,
      playerColor: moveData.playerColor || 'unknown',
      moveNotation: moveNotation // Use the notation from server if available
    };

    addMove(moveToAdd);



    console.log("✅ Opponent move applied successfully");
  };

  // Helper function to create move notation (if not provided)
  const createMoveNotation = (from, to, piece, capturedPiece, castled, board) => {
    if (castled) {
      return to.col === 6 ? "O-O" : "O-O-O";
    }

    const fromSquare = `${String.fromCharCode('a'.charCodeAt(0) + from.col)}${8 - from.row}`;
    const toSquare = `${String.fromCharCode('a'.charCodeAt(0) + to.col)}${8 - to.row}`;

    const pieceSymbol = piece.toUpperCase();
    if (piece === 'p' || piece === 'P') {
      if (capturedPiece) {
        return `${fromSquare[0]}x${toSquare}`;
      }
      return toSquare;
    }

    return `${pieceSymbol}${capturedPiece ? 'x' : ''}${toSquare}`;
  };

  // MODIFICATION 7: Helper function to create move notation

  // ALL YOUR EXISTING FUNCTIONS - KEPT EXACTLY AS IS
  // ChessPiece component handles piece rendering now

  function isUpperCase(str) {
    return str === str.toUpperCase();
  }

  const canCastleGeneral = () => {
    if ((isWhiteTurn && isKingInCheckHook[0]) || (!isWhiteTurn && isKingInCheckHook[1])
      ||
      (isWhiteTurn && kingsMoved[0]) || (!isWhiteTurn && kingsMoved[1])) return false;
    return true;
  };

  const canCastleLong = () => {
    let ind = -1;
    if (isWhiteTurn) ind = 1;
    else if (!isWhiteTurn) ind = 3;

    if (isWhiteTurn) {
      if (rooksMoved[ind]) return false;
    } else {
      if (rooksMoved[ind]) return false;
    }
    return true;
  }

  const canCastleShort = () => {
    let ind = -1;
    if (isWhiteTurn) ind = 0;
    else if (!isWhiteTurn) ind = 2;

    if (isWhiteTurn) {
      if (rooksMoved[ind]) return false;
    } else {
      if (rooksMoved[ind]) return false;
    }
    return true;
  }

  const isSquareUnderAttack = (row, col) => {
    for (let i = 0; i < allMoves.length; i++) {
      const [piece, prow, pcol, arow, acol] = allMoves[i];
      if (arow === row && acol === col) {
        return true;
      }
    }
    return false;
  };

  const isSquareAttacked = (row, col, attackerIsWhite, currentBoard) => {
    // 1. Check for pawns
    const pawnDir = attackerIsWhite ? 1 : -1;
    const opponentPawn = attackerIsWhite ? "P" : "p";
    const attackRow = row + pawnDir;
    if (attackRow >= 0 && attackRow < 8) {
      if (col - 1 >= 0 && currentBoard[attackRow][col - 1] === opponentPawn) return true;
      if (col + 1 < 8 && currentBoard[attackRow][col + 1] === opponentPawn) return true;
    }

    // 2. Check for knights
    const knightMoves = [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [1, -2], [-1, 2], [1, 2]];
    const opponentKnight = attackerIsWhite ? "N" : "n";
    for (const [dr, dc] of knightMoves) {
      if (row + dr >= 0 && row + dr < 8 && col + dc >= 0 && col + dc < 8) {
        if (currentBoard[row + dr][col + dc] === opponentKnight) return true;
      }
    }

    // 3. Check for king
    const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    const opponentKing = attackerIsWhite ? "K" : "k";
    for (const [dr, dc] of kingMoves) {
      if (row + dr >= 0 && row + dr < 8 && col + dc >= 0 && col + dc < 8) {
        if (currentBoard[row + dr][col + dc] === opponentKing) return true;
      }
    }

    // 4. Check for sliding pieces (Rook, Bishop, Queen)
    const opponentRook = attackerIsWhite ? "R" : "r";
    const opponentBishop = attackerIsWhite ? "B" : "b";
    const opponentQueen = attackerIsWhite ? "Q" : "q";

    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1], // Rook/Queen
      [1, 1], [1, -1], [-1, 1], [-1, -1] // Bishop/Queen
    ];

    for (let i = 0; i < 8; i++) {
      const [dr, dc] = directions[i];
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const piece = currentBoard[r][c];
        if (piece !== "") {
          if (i < 4) { // Straight lines
            if (piece === opponentRook || piece === opponentQueen) return true;
          } else { // Diagonals
            if (piece === opponentBishop || piece === opponentQueen) return true;
          }
          break; // Blocked
        }
        r += dr;
        c += dc;
      }
    }
    return false;
  };

  const getPseudoLegalMoves = (piece, row, col, currentBoard) => {
    const moves = [];
    if (!piece) return moves;

    const isPieceWhite = isUpperCase(piece);
    const direction = isPieceWhite ? -1 : 1;

    switch (piece.toLowerCase()) {
      case "p":
        if (currentBoard[row + direction]) {
          if (currentBoard[row + direction][col] == "")
            moves.push([piece, row, col, row + direction, col]);
          if (col - 1 >= 0) {
            if (piece === "p" && currentBoard[row + direction][col - 1] != "" && isUpperCase(currentBoard[row + direction][col - 1])) {
              moves.push([piece, row, col, row + direction, col - 1]);
            }
            else if (piece === "P" && currentBoard[row + direction][col - 1] != "" && !isUpperCase(currentBoard[row + direction][col - 1])) {
              moves.push([piece, row, col, row + direction, col - 1]);
            }
          }
          if (col + 1 < 8) {
            if (piece === "p" && currentBoard[row + direction][col + 1] != "" && isUpperCase(currentBoard[row + direction][col + 1])) {
              moves.push([piece, row, col, row + direction, col + 1]);
            }
            else if (piece === "P" && currentBoard[row + direction][col + 1] != "" && !isUpperCase(currentBoard[row + direction][col + 1])) {
              moves.push([piece, row, col, row + direction, col + 1]);
            }
          }
        }
        if ((row == 1 && piece === "p" && currentBoard[row + 2 * direction] && currentBoard[row + 2 * direction][col] == "" && currentBoard[row + direction][col] == "")
          || (row == 6 && piece === "P" && currentBoard[row + 2 * direction] && currentBoard[row + 2 * direction][col] == "" && currentBoard[row + direction][col] == ""))
          moves.push([piece, row, col, row + 2 * direction, col]);

        if (prevMove && ((row === 3 && piece === "P" && prevMove.piece === "p" &&
          Math.abs(prevMove.sqnumfrom - prevMove.sqnumto) === 2 && Math.abs(col - prevMove.tc) === 1)
          ||
          (row === 4 && piece === "p" && prevMove.piece === "P" &&
            Math.abs(prevMove.sqnumfrom - prevMove.sqnumto) === 2 && Math.abs(col - prevMove.tc) === 1))
        )
          moves.push([piece, row, col, row + direction, prevMove.tc]);

        break;

      case "r":
        let forwardMotion = true, backwardMotion = true, leftMotion = true, rightMotion = true;
        for (let i = 1; i < 8; i++) {
          if (forwardMotion && row + i < 8 && currentBoard[row + i][col] == "") moves.push([piece, row, col, row + i, col]);
          else if (forwardMotion && row + i < 8 && currentBoard[row + i][col] != "") {
            let rook = currentBoard[row][col];
            let attackPoint = currentBoard[row + i][col];
            if ((isUpperCase(rook) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(rook) && isUpperCase(attackPoint)))
              moves.push([piece, row, col, row + i, col]);
            forwardMotion = false;
          }
          if (backwardMotion && row - i >= 0 && currentBoard[row - i][col] == "") moves.push([piece, row, col, row - i, col]);
          else if (backwardMotion && row - i >= 0 && currentBoard[row - i][col] != "") {
            let rook = currentBoard[row][col];
            let attackPoint = currentBoard[row - i][col];
            if ((isUpperCase(rook) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(rook) && isUpperCase(attackPoint)))
              moves.push([piece, row, col, row - i, col]);
            backwardMotion = false;
          }
          if (rightMotion && col + i < 8 && currentBoard[row][col + i] === "") moves.push([piece, row, col, row, col + i]);
          else if (rightMotion && col + i < 8 && currentBoard[row][col + i] != "") {
            let rook = currentBoard[row][col];
            let attackPoint = currentBoard[row][col + i];
            if ((isUpperCase(rook) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(rook) && isUpperCase(attackPoint)))
              moves.push([piece, row, col, row, col + i]);
            rightMotion = false;
          }
          if (leftMotion && col - i >= 0 && currentBoard[row][col - i] === "") moves.push([piece, row, col, row, col - i]);
          else if (leftMotion && col - i >= 0 && currentBoard[row][col - i] != "") {
            let rook = currentBoard[row][col];
            let attackPoint = currentBoard[row][col - i];
            if ((isUpperCase(rook) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(rook) && isUpperCase(attackPoint)))
              moves.push([piece, row, col, row, col - i]);
            leftMotion = false;
          }
          if (!forwardMotion && !backwardMotion && !leftMotion && !rightMotion) break;
        }
        break;

      case "n":
        const knightMoves = [
          [-2, -1], [-2, 1], [2, -1], [2, 1],
          [-1, -2], [1, -2], [-1, 2], [1, 2]
        ];
        knightMoves.forEach(([r, c]) => {
          if (row + r >= 0 && row + r < 8 && col + c >= 0 && col + c < 8) {
            let knight = currentBoard[row][col];
            let attackPoint = currentBoard[row + r][col + c];
            if (attackPoint == "" ||
              (isUpperCase(knight) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(knight) && isUpperCase(attackPoint)))
              moves.push([piece, row, col, row + r, col + c]);
          }
        });
        break;

      case "k":
        const kingMoves = [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1], [0, 1],
          [1, -1], [1, 0], [1, 1]
        ];
        kingMoves.forEach(([r, c]) => {
          if (row + r >= 0 && row + r < 8 && col + c >= 0 && col + c < 8) {
            let king = currentBoard[row][col];
            let attackPoint = currentBoard[row + r][col + c];
            if (attackPoint === "" ||
              (isUpperCase(king) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(king) && isUpperCase(attackPoint))) {
              // Note: strictly, we should also check if the square is attacked
              // but we handle check-safety in getValidMoves (the legal filter)
              moves.push([piece, row, col, row + r, col + c]);
            }
          }
        });
        if (canCastleGeneral()) {
          const attackerIsWhite = !isUpperCase(piece);
          if (canCastleShort() && currentBoard[row][5] === "" && currentBoard[row][6] === ""
            && !isSquareAttacked(row, 4, attackerIsWhite, currentBoard)
            && !isSquareAttacked(row, 5, attackerIsWhite, currentBoard)
            && !isSquareAttacked(row, 6, attackerIsWhite, currentBoard)
          )
            moves.push([piece, row, col, row, 6]);
          if (canCastleLong() && currentBoard[row][3] === "" && currentBoard[row][2] === "" && currentBoard[row][1] === ""
            && !isSquareAttacked(row, 4, attackerIsWhite, currentBoard)
            && !isSquareAttacked(row, 3, attackerIsWhite, currentBoard)
            && !isSquareAttacked(row, 2, attackerIsWhite, currentBoard)
          ) {
            moves.push([piece, row, col, row, 2]);
          }
        }
        break;

      case "b":
        let tleftdiag = true, trightdiag = true,
          bleftdiag = true, brightdiag = true;

        for (let i = 1; i < 8; i++) {
          if (tleftdiag && row - i >= 0 && col - i >= 0 && currentBoard[row - i][col - i] === "") moves.push([piece, row, col, row - i, col - i]);
          else if (tleftdiag && row - i >= 0 && col - i >= 0 && currentBoard[row - i][col - i] != "") {
            let bishop = currentBoard[row][col];
            let attackPoint = currentBoard[row - i][col - i];
            if ((isUpperCase(bishop) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(bishop) && isUpperCase(attackPoint)))
              moves.push([piece, row, col, row - i, col - i]);
            tleftdiag = false;
          }
          if (trightdiag && row - i >= 0 && col + i < 8 && currentBoard[row - i][col + i] === "") moves.push([piece, row, col, row - i, col + i]);
          else if (trightdiag && row - i >= 0 && col + i < 8 && currentBoard[row - i][col + i] != "") {
            let bishop = currentBoard[row][col];
            let attackPoint = currentBoard[row - i][col + i];
            if ((isUpperCase(bishop) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(bishop) && isUpperCase(attackPoint)))
              moves.push([piece, row, col, row - i, col + i]);
            trightdiag = false;
          }
          if (bleftdiag && row + i < 8 && col - i >= 0 && currentBoard[row + i][col - i] === "") moves.push([piece, row, col, row + i, col - i]);
          else if (bleftdiag && row + i < 8 && col - i >= 0 && currentBoard[row + i][col - i] != "") {
            let bishop = currentBoard[row][col];
            let attackPoint = currentBoard[row + i][col - i];
            if ((isUpperCase(bishop) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(bishop) && isUpperCase(attackPoint)))
              moves.push([piece, row, col, row + i, col - i]);
            bleftdiag = false;
          }
          if (brightdiag && row + i < 8 && col + i < 8 && currentBoard[row + i][col + i] === "") moves.push([piece, row, col, row + i, col + i]);
          else if (brightdiag && row + i < 8 && col + i < 8 && currentBoard[row + i][col + i] != "") {
            let bishop = currentBoard[row][col];
            let attackPoint = currentBoard[row + i][col + i];
            if ((isUpperCase(bishop) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(bishop) && isUpperCase(attackPoint)))
              moves.push([piece, row, col, row + i, col + i]);
            brightdiag = false;
          }
        }
        break;

      case "q":
        let qforwardMotion = true, qbackwardMotion = true, qleftMotion = true, qrightMotion = true;
        for (let i = 1; i < 8; i++) {
          if (qforwardMotion && row + i < 8 && currentBoard[row + i][col] == "") moves.push([piece, row, col, row + i, col]);
          else if (qforwardMotion && row + i < 8 && currentBoard[row + i][col] != "") {
            let rook = currentBoard[row][col];
            let attackPoint = currentBoard[row + i][col];
            if ((isUpperCase(rook) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(rook) && isUpperCase(attackPoint)))
              moves.push([piece, row, col, row + i, col]);
            qforwardMotion = false;
          }
          if (qbackwardMotion && row - i >= 0 && currentBoard[row - i][col] == "") moves.push([piece, row, col, row - i, col]);
          else if (qbackwardMotion && row - i >= 0 && currentBoard[row - i][col] != "") {
            let rook = currentBoard[row][col];
            let attackPoint = currentBoard[row - i][col];
            if ((isUpperCase(rook) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(rook) && isUpperCase(attackPoint)))
              moves.push([piece, row, col, row - i, col]);
            qbackwardMotion = false;
          }
          if (qrightMotion && col + i < 8 && currentBoard[row][col + i] === "") moves.push([piece, row, col, row, col + i]);
          else if (qrightMotion && col + i < 8 && currentBoard[row][col + i] != "") {
            let rook = currentBoard[row][col];
            let attackPoint = currentBoard[row][col + i];
            if ((isUpperCase(rook) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(rook) && isUpperCase(attackPoint)))
              moves.push([piece, row, col, row, col + i]);
            qrightMotion = false;
          }
          if (qleftMotion && col - i >= 0 && currentBoard[row][col - i] === "") moves.push([piece, row, col, row, col - i]);
          else if (qleftMotion && col - i >= 0 && currentBoard[row][col - i] != "") {
            let rook = currentBoard[row][col];
            let attackPoint = currentBoard[row][col - i];
            if ((isUpperCase(rook) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(rook) && isUpperCase(attackPoint)))
              moves.push([piece, row, col, row, col - i]);
            qleftMotion = false;
          }
          if (!qforwardMotion && !qbackwardMotion && !qleftMotion && !qrightMotion) break;
        }
        let qtleftdiag = true, qtrightdiag = true,
          qbleftdiag = true, qbrightdiag = true;

        for (let i = 1; i < 8; i++) {
          if (qtleftdiag && row - i >= 0 && col - i >= 0 && currentBoard[row - i][col - i] === "") moves.push([piece, row, col, row - i, col - i]);
          else if (qtleftdiag && row - i >= 0 && col - i >= 0 && currentBoard[row - i][col - i] != "") {
            let bishop = currentBoard[row][col];
            let attackPoint = currentBoard[row - i][col - i];
            if ((isUpperCase(bishop) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(bishop) && isUpperCase(attackPoint)))
              moves.push([piece, row, col, row - i, col - i]);
            qtleftdiag = false;
          }
          if (qtrightdiag && row - i >= 0 && col + i < 8 && currentBoard[row - i][col + i] === "") moves.push([piece, row, col, row - i, col + i]);
          else if (qtrightdiag && row - i >= 0 && col + i < 8 && currentBoard[row - i][col + i] != "") {
            let bishop = currentBoard[row][col];
            let attackPoint = currentBoard[row - i][col + i];
            if ((isUpperCase(bishop) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(bishop) && isUpperCase(attackPoint)))
              moves.push([piece, row, col, row - i, col + i]);
            qtrightdiag = false;
          }
          if (qbleftdiag && row + i < 8 && col - i >= 0 && currentBoard[row + i][col - i] === "") moves.push([piece, row, col, row + i, col - i]);
          else if (qbleftdiag && row + i < 8 && col - i >= 0 && currentBoard[row + i][col - i] != "") {
            let bishop = currentBoard[row][col];
            let attackPoint = currentBoard[row + i][col - i];
            if ((isUpperCase(bishop) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(bishop) && isUpperCase(attackPoint)))
              moves.push([piece, row, col, row + i, col - i]);
            qbleftdiag = false;
          }
          if (qbrightdiag && row + i < 8 && col + i < 8 && currentBoard[row + i][col + i] === "") moves.push([piece, row, col, row + i, col + i]);
          else if (qbrightdiag && row + i < 8 && col + i < 8 && currentBoard[row + i][col + i] != "") {
            let bishop = currentBoard[row][col];
            let attackPoint = currentBoard[row + i][col + i];
            if ((isUpperCase(bishop) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(bishop) && isUpperCase(attackPoint)))
              moves.push([piece, row, col, row + i, col + i]);
            qbrightdiag = false;
          }
        }
        break;

      default:
        break;
    }

    return moves;
  };

  const getValidMoves = (piece, row, col) => {
    const pseudoMoves = getPseudoLegalMoves(piece, row, col, board);
    const isPlayerWhite = isUpperCase(piece);

    return pseudoMoves.filter(move => {
      const [p, fr, fc, tr, tc] = move;

      // Create a temporary board to simulate the move
      const tempBoard = board.map(row => [...row]);
      tempBoard[tr][tc] = p;
      tempBoard[fr][fc] = "";

      // Handle extra logic for special moves (castling) in check detection
      // For castling, the king moves from (7,4) to (7,6) or (7,2)
      if (p.toLowerCase() === 'k' && Math.abs(fc - tc) === 2) {
        // Castling moves are already filtered for through-check in getPseudoLegalMoves
        // But we double check the final position here.
      }

      // Handle En Passant in simulation
      if (p.toLowerCase() === 'p' && fc !== tc && board[tr][tc] === "") {
        const captureRow = fr;
        tempBoard[captureRow][tc] = "";
      }

      // Find my king's position on the new board
      let kingR = -1, kingC = -1;
      const myKing = isPlayerWhite ? 'K' : 'k';

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (tempBoard[r][c] === myKing) {
            kingR = r;
            kingC = c;
            break;
          }
        }
        if (kingR !== -1) break;
      }

      if (kingR === -1) return false; // Should not happen

      // Is the square occupied by my king under attack by the opponent?
      const attackerIsWhite = !isPlayerWhite;
      return !isSquareAttacked(kingR, kingC, attackerIsWhite, tempBoard);
    });
  };

  const filterFromAllMoves = (piece, row, col) => {
    const filteredMovesOfPiece = [];
    for (let i = 0; i < allMoves.length; i++) {
      const [movePiece, movePieceRow, movePieceCol,
        movePieceAttackRow, movePieceAttackCol] = allMoves[i];

      if (movePiece === piece && movePieceRow === row && movePieceCol === col) {
        filteredMovesOfPiece.push([movePieceAttackRow, movePieceAttackCol]);
      }
    }

    return filteredMovesOfPiece;
  }

  // MODIFICATION 8: Update handleSquareClick with connection check
  const handleSquareClick = (row, col) => {
    // Check if connected and it's our turn
    if (!isConnected) {
      alert("Not connected to server!");
      return;
    }

    if (!isMyTurn) {
      alert("It's not your turn!");
      return;
    }

    const piece = board[row][col];
    if (isSquareSelected && selectedSquare[0] === row && selectedSquare[1] === col) {
      setSelectedSquare([]);
      setIsSquareSelected(false);
      setValidMoves([]);
      return;
    }
    if (!piece || (isWhiteTurn && !isUpperCase(piece)) || (!isWhiteTurn && isUpperCase(piece))) return;
    setIsSquareSelected(true);
    setSelectedSquare([row, col]);
    setValidMoves(filterFromAllMoves(piece, row, col));
  };

  // MODIFICATION 9: Update handleDragStart with connection check
  const handleDragStart = (e, row, col) => {
    // Check if connected and it's our turn
    if (!isConnected || !isMyTurn) {
      e.preventDefault();
      return;
    }

    const piece = board[row][col];
    if (!piece || (isWhiteTurn && !isUpperCase(piece)) || (!isWhiteTurn && isUpperCase(piece))) {
      e.preventDefault();
      return;
    }

    setIsSquareSelected(true);
    setSelectedSquare([row, col]);
    setValidMoves(filterFromAllMoves(piece, row, col));
    e.dataTransfer.setData("piece", piece);
    e.dataTransfer.setData("fromRow", row);
    e.dataTransfer.setData("fromCol", col);
  };

  const isKingInCheck = () => {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if ((isWhiteTurn && isUpperCase(piece)) || (!isWhiteTurn && !isUpperCase(piece))) {
          const kingRow = isWhiteTurn ? blackKingCoordinates[0] : whiteKingCoordinates[0];
          const kingCol = isWhiteTurn ? blackKingCoordinates[1] : whiteKingCoordinates[1];
          const moves = getValidMoves(piece, i, j);
          if (moves.some(([alpha, beta, gamma, r, c]) => r === kingRow && c === kingCol)) {
            if (isWhiteTurn) {
              setIsKingInCheckHook(prevState => [prevState[0], true]);
            } else {
              setIsKingInCheckHook(prevState => [true, prevState[1]]);
            }
            console.log(isKingInCheckHook[0]);
            return true;
          }
        }
      }
    }
    return false;
  }

  const convertBoardToFEN = (board) => {
    const rows = [];
    for (let row of board) {
      let rowStr = '';
      let emptyCount = 0;

      for (let square of row) {
        if (square === '') {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            rowStr += emptyCount;
            emptyCount = 0;
          }
          rowStr += square;
        }
      }

      if (emptyCount > 0) {
        rowStr += emptyCount;
      }

      rows.push(rowStr);
    }

    const boardFEN = rows.join('/');
    const activeColor = isWhiteTurn ? 'w' : 'b';
    const castlingRights = 'KQkq';
    const enPassant = '-';
    const halfMoveClock = 0;
    const fullMoveNumber = 1;

    const fen = `${boardFEN} ${activeColor} ${castlingRights} ${enPassant} ${halfMoveClock} ${fullMoveNumber}`;

    return fen;
  };

  const updatePrevMove = (fr, fc, tr, tc, piece, capturedPiece, castled, fenBefore) => {
    const sqnumfrom = 8 - fr;
    const sqnumto = 8 - tr;
    let moveFrom = String.fromCharCode('a'.charCodeAt(0) + fc);
    let moveTo = String.fromCharCode('a'.charCodeAt(0) + tc);

    if (castled) {
      if (tc === 2) {
        moveTo = "O-O-O";
        if (fr === 0) {
          setRooksMoved([rooksMoved[0], rooksMoved[1], rooksMoved[2], true]);
          setKingsMoved([kingsMoved[0], true]);
        }
        else if (fr === 7) {
          setRooksMoved([rooksMoved[0], true, rooksMoved[2], rooksMoved[3]]);
          setKingsMoved([true, kingsMoved[1]]);
        }
      }
      else {
        moveTo = "O-O";
        if (fr === 0) {
          setRooksMoved([rooksMoved[0], rooksMoved[1], rooksMoved[2], true]);
          setKingsMoved([kingsMoved[0], true]);
        }
        else if (fr === 7) {
          setRooksMoved([rooksMoved[0], rooksMoved[1], true, rooksMoved[3]]);
          setKingsMoved([true, kingsMoved[1]]);
        }
      }
    }
    else {
      if (capturedPiece === "") {
        moveFrom += sqnumfrom;
        moveTo = "" + (piece.toLowerCase() === "p" ? "" : piece) + moveTo + sqnumto;
      }
      else {
        moveTo = (piece.toLowerCase() === "p" ? moveFrom : piece) + "x" + moveTo + sqnumto;
        moveFrom += sqnumfrom;
      }
    }

    if (isKingInCheck()) {
      moveTo += "+";
    }
    else {
      setIsKingInCheckHook([false, false]);
    }

    const fenAfter = convertBoardToFEN(board);
    const createdAt = new Date().toISOString();
    setPrevMove({ piece, moveFrom, moveTo, sqnumfrom, sqnumto, tc, tr });

    // MODIFICATION 10: Move history is now handled by GameContainer via WebSocket
    // addMove({ piece, moveFrom, moveTo, sqnumfrom, sqnumto, tc, tr, fenBefore, fenAfter, createdAt });

    // after effects
    if (piece === "R" && fc === 0) {
      setRooksMoved([rooksMoved[0], true, rooksMoved[2], rooksMoved[3]]);
    }
    else if (piece === "R" && fc === 7) {
      setRooksMoved([true, rooksMoved[1], rooksMoved[2], rooksMoved[3]]);
    }
    else if (piece === "r" && fc === 0) {
      setRooksMoved([rooksMoved[0], rooksMoved[1], rooksMoved[2], true]);
    }
    else if (piece === "r" && fc === 7) {
      setRooksMoved([rooksMoved[0], rooksMoved[1], true, rooksMoved[3]]);
    }

    if (piece === "K") {
      setKingsMoved([true, kingsMoved[1]]);
      setWhiteKingCoordinates([tr, tc]);
    }
    else if (piece === "k") {
      setKingsMoved([kingsMoved[0], true]);
      setBlackKingCoordinates([tr, tc]);
    }
  }

  // MODIFICATION 11: Update handlePromotion to send move to server
  const handlePromotion = (promotionPiece) => {
    const [row, col, piece, fromRow, fromCol, capturedPiece, fenBefore, castled, isEnPassant] = promotingPawn;

    const promotedPiece = (row === 7) ? promotionPiece.toLowerCase() : promotionPiece.toUpperCase();

    const newBoard = [...board];
    newBoard[row][col] = promotedPiece;
    newBoard[fromRow][fromCol] = "";

    setBoard(newBoard);

    // Update move locally
    updatePrevMove(fromRow, fromCol, row, col, piece, capturedPiece, castled, fenBefore);

    // Generate move notation
    const notation = createMoveNotation(
      { row: fromRow, col: fromCol },
      { row: row, col: col },
      piece,
      capturedPiece,
      castled,
      newBoard
    );

    // MODIFICATION 12: Prepare and send move data to server
    const moveData = {
      from: { row: fromRow, col: fromCol },
      to: { row: row, col: col },
      piece: piece,
      promotedTo: promotedPiece,
      capturedPiece: capturedPiece,
      castled: castled,
      isEnPassant: isEnPassant,
      fenBefore: fenBefore,
      fenAfter: convertBoardToFEN(newBoard),
      board: newBoard,
      timestamp: new Date().toISOString(),
      isWhiteTurn: isWhiteTurn,
      isPromotion: true,
      matchId: matchId,
      playerColor: playerColor?.toLowerCase(),
      moveNotation: notation
    };

    // Send move to server via WebSocket
    if (sendMove) {
      const success = sendMove(moveData);
      if (!success) {
        console.error("Failed to send promotion move to server");
      }
    }

    setShowModal(false);
  };

  const getMovesOfPlayer = () => {
    let movesCount = 0;
    const currentMoves = [];

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece && ((isUpperCase(piece) && isWhiteTurn) || (!isUpperCase(piece) && !isWhiteTurn))) {
          const pieceMoves = getValidMoves(piece, i, j);
          currentMoves.push(...pieceMoves);
          movesCount += pieceMoves.length;
        }
      }
    }

    setPrevAllMoves(allMoves);
    setAllMoves(currentMoves);

    // Check for game over
    if (currentMoves.length === 0) {
      // Find current player's king
      let kingR = -1, kingC = -1;
      const myKing = isWhiteTurn ? 'K' : 'k';
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (board[r][c] === myKing) {
            kingR = r; kingC = c; break;
          }
        }
        if (kingR !== -1) break;
      }

      // If king is missing, game is over!
      if (kingR === -1) {
        const winner = isWhiteTurn ? "Black" : "White";
        setGameStatus(`checkmate-${winner}`);
        console.log(`🏁 King is missing! ${winner} wins.`);
        return;
      }

      const isUnderCheck = isSquareAttacked(kingR, kingC, !isWhiteTurn, board);
      if (isUnderCheck) {
        const winner = isWhiteTurn ? "Black" : "White";
        setGameStatus(`checkmate-${winner}`);
        console.log(`🏁 CHECKMATE! ${winner} wins.`);
      } else {
        setGameStatus("stalemate");
        console.log("🏁 STALEMATE!");
      }
    }
  }

  // MODIFICATION 13: Update handleDrop to send move to server
  const handleDrop = (e, row, col) => {
    // Check connection and turn
    if (!isConnected) {
      alert("Not connected to server!");
      return;
    }

    if (!isMyTurn) {
      alert("It's not your turn!");
      return;
    }

    let piece = e.dataTransfer.getData("piece");
    const fromRow = parseInt(e.dataTransfer.getData("fromRow"));
    const fromCol = parseInt(e.dataTransfer.getData("fromCol"));
    const fenBefore = convertBoardToFEN(board);
    const newBoard = [...board];
    let capturedPiece = newBoard[row][col];
    let castled = false;
    let isEnPassant = false;

    if (validMoves.some(([r, c]) => r === row && c === col)) {
      // enpassant capture
      if (piece.toLowerCase() === "p" && capturedPiece === "" && Math.abs(col - fromCol) === 1) {
        isEnPassant = true;
        if (piece === "p") {
          capturedPiece = newBoard[row - 1][col];
          newBoard[row - 1][col] = "";
        }
        else {
          capturedPiece = newBoard[row + 1][col];
          newBoard[row + 1][col] = "";
        }
      }

      // promotion
      if (piece === "p" && row === 7) {
        setPromotingPawn([row, col, piece, fromRow, fromCol, capturedPiece, fenBefore, castled, isEnPassant]);
        setShowModal(true);
        setIsSquareSelected(false);
        setSelectedSquare([]);
        setValidMoves([]);
        return;
      } else if (piece === "P" && row === 0) {
        setPromotingPawn([row, col, piece, fromRow, fromCol, capturedPiece, fenBefore, castled, isEnPassant]);
        setShowModal(true);
        setIsSquareSelected(false);
        setSelectedSquare([]);
        setValidMoves([]);
        return;
      }

      // castling logic
      if (piece.toLowerCase() === "k" && Math.abs(col - fromCol) === 2) {
        castled = true;
        // white short castle
        if (piece === "K" && col === 6) {
          const rook = newBoard[row][7];
          newBoard[row][7] = "";
          newBoard[row][5] = rook;
        }
        // white long castle
        if (piece === "K" && col === 2) {
          const rook = newBoard[row][0];
          newBoard[row][0] = "";
          newBoard[row][3] = rook;
        }
        // black short castle
        if (piece === "k" && col === 6) {
          const rook = newBoard[row][7];
          newBoard[row][7] = "";
          newBoard[row][5] = rook;
        }
        // black long castle
        if (piece === "k" && col === 2) {
          const rook = newBoard[row][0];
          newBoard[row][0] = "";
          newBoard[row][3] = rook;
        }
      }

      newBoard[row][col] = piece;
      newBoard[fromRow][fromCol] = "";
      setBoard(newBoard);

      // Update move locally
      updatePrevMove(fromRow, fromCol, row, col, piece, capturedPiece, castled, fenBefore);

      const notation = createMoveNotation(
        { row: fromRow, col: fromCol },
        { row: row, col: col },
        piece,
        capturedPiece,
        castled,
        newBoard
      );

      const moveData = {
        from: { row: fromRow, col: fromCol },
        to: { row: row, col: col },
        fromRow: fromRow,
        fromCol: fromCol,
        toRow: row,
        toCol: col,
        piece: piece,
        capturedPiece: capturedPiece || "",
        castled: castled || false,
        isEnPassant: isEnPassant || false,
        isPromotion: false,
        fenBefore: fenBefore,
        fenAfter: convertBoardToFEN(newBoard),
        board: newBoard,
        isWhiteTurn: isWhiteTurn,
        playerColor: playerColor?.toLowerCase(),
        matchId: matchId,
        timestamp: new Date().toISOString(),
        moveNotation: notation
      };

      if (sendMove) {
        sendMove(moveData);
      }
      setIsSquareSelected(false);
      setSelectedSquare([]);
      setValidMoves([]);
    } // Closing the if block from line 959
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="chessboard-wrapper">
      <div
        ref={boardRef}
        className="board"
        style={{ width: boardSize, height: boardSize }}
      >
        {board.map((row, rIdx) => {
          return row.map((_, cIdx) => {
            // If black, we flip the board: row 0 becomes 7, col 0 becomes 7
            const isFlipped = playerColor === 'black';
            const rowIndex = isFlipped ? 7 - rIdx : rIdx;
            const colIndex = isFlipped ? 7 - cIdx : cIdx;
            const piece = board[rowIndex][colIndex];

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`square ${((rowIndex + colIndex) % 2 === 0) ? 'light' : 'dark'} ${selectedSquare && selectedSquare[0] === rowIndex && selectedSquare[1] === colIndex ? 'selected' : ''} ${validMoves.some(([r, c]) => r === rowIndex && c === colIndex) ? 'valid-move' : ''}`}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
                onDragStart={(e) => handleDragStart(e, rowIndex, colIndex)}
                onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                onDragOver={handleDragOver}
                draggable={piece !== "" && isConnected && isMyTurn}
              >
                {piece !== "" && <ChessPiece piece={piece} className="piece" />}

                {/* Modern Labels */}
                {((!isFlipped && colIndex === 7) || (isFlipped && colIndex === 0)) &&
                  <span className="board-label label-rank">{8 - rowIndex}</span>
                }
                {((!isFlipped && rowIndex === 7) || (isFlipped && rowIndex === 0)) &&
                  <span className="board-label label-file">{String.fromCharCode(97 + colIndex)}</span>
                }
              </div>
            );
          });
        })}
      </div>
      {gameStatus !== "active" && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <h2>Game Over</h2>
            <p>
              {gameStatus.includes('checkmate')
                ? `CHECKMATE - ${gameStatus.split('-')[1].toUpperCase()} WINS`
                : gameStatus.includes('RESIGNED')
                  ? "GAME OVER - PLAYER RESIGNED"
                  : gameStatus.toUpperCase()}
            </p>
            <button onClick={() => window.location.href = '/home'}>Back to Home</button>
          </div>
        </div>
      )}
      <PromotionModal
        showModal={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handlePromotion}
      />
    </div>
  );
};

export default Board;