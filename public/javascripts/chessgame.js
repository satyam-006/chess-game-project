const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square",
                (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece",
                    square.color === "w" ? "white" : "black"
                );
                pieceElement.innerHTML = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;
                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareindex };
                        e.dataTransfer.setData("text/plain", "");

                    }
                });

                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });
                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", function (e) {
                e.preventDefault();
            });
            squareElement.addEventListener("drop", function (e) {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSource)
                }
            });
            boardElement.appendChild(squareElement);
        });

    });


    if (playerRole === "b") {
        boardElement.classList.add("flipped");
    }
    else {
        boardElement.classList.remove("flipped");
    }
};

let whiteCapturedPieces = [];
let blackCapturedPieces = [];

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q",
    };

    const result = chess.move(move);

    if (result) {
        socket.emit("move", move);

        if (result.captured) {
            const capturedPiece = result.captured;

            if (result.color === 'w') {
                blackCapturedPieces.push(capturedPiece);
            } else {
                whiteCapturedPieces.push(capturedPiece);
            }

            updateCapturedPiecesUI();
        }

        if (chess.in_checkmate()) {
            socket.emit("checkmate", playerRole);
            // alert("Checkmate! Game over.");
        } else if (chess.in_stalemate()) {
            // socket.emit("stalemate");
            // alert("Stalemate! Game is a draw.");
        } else if (chess.in_draw()) {
            // socket.emit("draw");
            // alert("Draw! Game is a draw.");
        } else if (chess.in_check()) {
            // alert("Check!");
        }
    }

    renderBoard();
};

const updateCapturedPiecesUI = () => {
    const whiteCapturedElement = document.getElementById("white-captured");
    const blackCapturedElement = document.getElementById("black-captured");

    whiteCapturedElement.innerHTML = "";
    blackCapturedElement.innerHTML = "";

    whiteCapturedPieces.forEach(piece => {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add("piece");
        pieceElement.innerHTML = getPieceUnicode({ type: piece, color: 'w' });
        whiteCapturedElement.appendChild(pieceElement);
    });

    blackCapturedPieces.forEach(piece => {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add("piece");
        pieceElement.innerHTML = getPieceUnicode({ type: piece, color: 'b' });
        blackCapturedElement.appendChild(pieceElement);
    });
};


socket.on("move", function (move) {
    chess.move(move);
    renderBoard();
});


socket.on("checkmate", function (winner) {
    alert(`${winner === "w" ? "White" : "Black"} wins by checkmate!`);
    boardElement.style.pointerEvents = "none"; // Disable further moves
});


const getPieceUnicode = (piece) => {
    const unicodePieces = {
        // p: '<img src="/images/pawn.png" style="width:35px;height=35px"></img>',
        // r: '<img src="/images/rook.png" style="width:35px;height=35px"></img>',
        // n: '<img src="/images/knight.png" style="width:35px;height=35px"></img>',
        // b: '<img src="/images/bishop.png" style="width:15px;height=15px"></img>',
        // q: '<img src="/images/queen.png" style="width:15px;height=15px"></img>',
        // k: '<img src="/images/king.png" style="width:15px;height=15px"></img>',
        // P: '<img src="/images/pawn.png" style="width:35px;height=35px"></img>',
        // R: '<img src="/images/rook.png" style="width:35px;height=35px"></img>',
        // N: '<img src="/images/knight.png" style="width:35px;height=35px"></img>',
        // B: '<img src="/images/bishop.png" style="width:15px;height=15px"></img>',
        // Q: '<img src="/images/queen.png" style="width:15px;height=15px"></img>',
        // K: '<img src="/images/king.png" style="width:15px;height=15px"></img>',
        p: '♙',
        r: '♖',
        n: '♘',
        b: '♗',
        q: '♕',
        k: '♔',
        P: '♙',
        R: '♖',
        N: '♘',
        B: '♗',
        Q: '♕',
        K: '♔',

    }

    return unicodePieces[piece.type] || "";
};

socket.on("playerRole", function (role) {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", function () {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", function (fen) {
    chess.load(fen)
    renderBoard();
});

socket.on("move", function (move) {
    chess.move(move)
    renderBoard();
});

renderBoard();