

const PawnMoves = (isKingInCheck, board, row, col, prevMove) =>{
    const moves = [];
    const piece = board[row][col];
    const direction = piece === "p" ? 1 : -1;  

    if(isKingInCheck){
        // check whether this pawn can capture the attacking piece or block the check
        
        

        return moves;
    }

    if (board[row + direction]) {
        if(board[row+direction][col] == "")
            moves.push([row + direction, col]);
        if(col-1>=0){
          if(piece === "p" && board[row+direction][col-1]!= "" && isUpperCase(board[row+direction][col-1])){
            moves.push([row + direction, col-1]);
          }
          else if(piece === "P" && board[row+direction][col-1]!= "" && !isUpperCase(board[row+direction][col-1])){
            moves.push([row + direction, col-1]);
          }
        }
        if(col+1<8){
          if(piece === "p" && board[row+direction][col+1]!= "" && isUpperCase(board[row+direction][col+1])){
            moves.push([row + direction, col+1]);
          }
          else if(piece === "P" && board[row+direction][col+1]!= "" && !isUpperCase(board[row+direction][col+1])){
            moves.push([row + direction, col+1]);
          }
        }
    }
    if((row == 1 && piece === "p" &&  board[row+2*direction][col] == "" && board[row+direction][col] == "")
        || (row == 6 && piece === "P" &&  board[row+2*direction][col] == "" && board[row+direction][col] == ""))
            moves.push([row + 2*direction, col]);
        
    if((row === 3 && piece === "P" && prevMove.piece === "p" && 
          Math.abs(prevMove.sqnumfrom-prevMove.sqnumto) === 2 && Math.abs(col-prevMove.tc)===1)
        ||
          (row === 4 && piece === "p" && prevMove.piece === "P" && 
          Math.abs(prevMove.sqnumfrom-prevMove.sqnumto) === 2 && Math.abs(col-prevMove.tc)===1)
        )
            moves.push([row + direction, prevMove.tc]);
    return moves;
};