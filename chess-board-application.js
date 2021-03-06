const {
  /* eslint-disable no-unused-vars */
  Coordinates,
  Piece,
  IdentifierDefinition,
  identifiers,
  colours,
  colors
  /* eslint-enable no-unused-vars */
} = ((window) => {
  const chessBoardFields = {
    tiles: Symbol('tiles')
  };

  class ChessBoard extends HTMLElement {
    constructor() {
      super();

      this.attachShadow({ mode: "open" });

      const styles = document.createElement("style");
      this.shadowRoot.appendChild(styles);
      styles.textContent = `
            #board {
                display: flex;
                flex-wrap: wrap;
                justify-content: flex-end;
                width: 540px;
                color: #111;
            }
        
            h1, #information {
                width: 480px;
                margin-left: 40px;
                font-family: monospace;
            }
            
            #information {
                margin-bottom: .45em;
            }
        
            #y-descriptor, #x-descriptor {
                display: flex;
                justify-content: space-around;
                color: #555;
                font-family: monospace;
            }
        
            #y-descriptor {
                height: 480px;
                width: 40px;
                flex-direction: column-reverse;
                align-items: flex-end;
                padding-right: .5em;
            }
        
            #x-descriptor {
                height: 30px;
                width: 480px;
                padding-top: .3em;
            }

            #y-descriptor div, #x-descriptor div {
                display: inline-block;
            }
        
            #tile-container {
                display: flex;
                flex-wrap: wrap;
                width: 480px;
                height: 480px;
                user-select: none;
                font-family: sans-serif;
            }
        
            #tile-container div {
                height: 12.5%;
                width: 12.5%;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 3em;
            }
        
            #tile-container div.has-piece {
                cursor: pointer;
            }

            #tile-container div.light-tile {
                background: #ddd;
            }
            #tile-container div.possible-move {
                cursor: pointer;
            }
            #tile-container div.light-tile.possible-move {
                background: #bfb;
            }
            #tile-container div.dark-tile {
                background-color: #aaa;
            }
            #tile-container div.dark-tile.possible-move {
                background-color: #8c8;
            }
        `;

      const board = document.createElement("div");
      board.id = "board";

      const title = document.createElement("h1");
      title.innerText = "Chess in Javascript";

      const information = document.createElement("div");
      information.id = "information";
      information.innerHTML = `<a href="https://github.com/oktupol/javascript-chess">View this project on Github</a>`;

      const tileContainer = document.createElement("div");
      tileContainer.id = "tile-container";

      const xDescriptor = document.createElement("div");
      xDescriptor.id = "x-descriptor";

      const yDescriptor = document.createElement("div");
      yDescriptor.id = "y-descriptor";

      this.shadowRoot.appendChild(board);
      board.appendChild(title);
      board.appendChild(information);
      board.appendChild(yDescriptor);
      board.appendChild(tileContainer);
      board.appendChild(xDescriptor);

      this[chessBoardFields.tiles] = [];

      for (let y = 7; y >= 0; y--) {
        this[chessBoardFields.tiles][y] = [];
        for (let x = 0; x < 8; x++) {
          /** @var {ChessTile} tile */
          const tile = document.createElement("div", { is: "chess-tile" });
          tile.coordinates = new Coordinates(x, y);
          tile.board = this;
          tileContainer.appendChild(tile);
          this[chessBoardFields.tiles][y][x] = tile;
        }
      }

      for (let i = 0; i < 8; i++) {
        const xLabel = document.createElement("div");
        const yLabel = document.createElement("div");

        xLabel.innerText = `x: ${i}`;
        yLabel.innerText = `y: ${i}`;

        xDescriptor.appendChild(xLabel);
        yDescriptor.appendChild(yLabel);
      }

      this.addEventListener("click", (event) => {
        const clickPath = event.composedPath();
        const tileArray = clickPath.filter((elem) => elem instanceof ChessTile);

        if (tileArray.length === 0) {
          return;
        } else if (tileArray.length > 1) {
          throw new Error("Clicked on multiple tiles at once");
        }

        /** @var {TMLChessTileElement} tile */
        const tile = tileArray[0];

        if (tile.possibleMove instanceof PossibleMove) {
          const target = this.getTileAt(tile.possibleMove.coordinates);
          target.piece = tile.possibleMove.piece;

          this.clearPossibleMoves();
        } else if (tile.piece instanceof Piece) {
          this.clearPossibleMoves();

          let moves = tile.piece.getMoves();
          if (!moves) {
            moves = [];
          }

          if (
            !Array.isArray(moves) ||
            moves.filter((move) => !(move instanceof Coordinates)).length > 0
          ) {
            throw new Error('"getMoves" must return an array of coordinates.');
          }

          for (const move of moves) {
            this.getTileAt(move).possibleMove = new PossibleMove(
              tile.piece,
              move
            );
          }
        } else {
          this.clearPossibleMoves();
        }
      });
    }

    clearPossibleMoves() {
      this[chessBoardFields.tiles].forEach((tileRow) =>
        tileRow.forEach((tile) => (tile.possibleMove = null))
      );
    }

    /**
     * @param {Coordinates} coordinates
     * @returns {ChessTile}
     */
    getTileAt(coordinates) {
      return this[chessBoardFields.tiles][coordinates.y][coordinates.x];
    }

    /**
     * @param {Coordinates} coordinates
     * @returns {Piece}
     */
    getPieceAt(coordinates) {
      return this.getTileAt(coordinates).piece;
    }

    /**
     * @returns {Piece[]}
     */
    getAllPieces() {
      return this[chessBoardFields.tiles]
        .flat()
        .map((tile) => tile.piece)
        .filter((piece) => piece);
    }

    /**
     * @param {symbol} colour
     * @returns {Piece[]}
     */
    getAllPiecesOfColour(colour) {
      return this.getAllPieces().filter((piece) => piece.colour === colour);
    }

    getAllPiecesOfColor(colour) {
      return this.getAllPiecesOfColour(colour);
    }

    get [Symbol.toStringTag]() {
      return 'ChessBoard';
    }
  }
  window.customElements.define("chess-board", ChessBoard);

  const chessTileFields = {
    coordinates: Symbol('coordinates'),
    piece: Symbol('piece'),
    possibleMove: Symbol('possibleMove'),
    identifierHolder: Symbol('identifierHolder'),
  };

  class ChessTile extends HTMLDivElement {
    /**
     * @param {Coordinates} coordinates
     */
    constructor() {
      super();
      this.board = null;
      this[chessTileFields.coordinates] = null;
      this[chessTileFields.piece] = null;
      this[chessTileFields.possibleMove] = null;

      this[chessTileFields.identifierHolder] = document.createElement("span");
      this.appendChild(this[chessTileFields.identifierHolder]);
    }

    /**
     * @returns {Coordinates}
     */
    get coordinates() {
      return this[chessTileFields.coordinates];
    }

    /**
     * @param {Coordinates} coordinates
     */
    set coordinates(coordinates) {
      if (this[chessTileFields.coordinates]) {
        throw new Error("Cannot redefine coordinates of existing tiles");
      }

      this[chessTileFields.coordinates] = coordinates;

      if ((coordinates.x + coordinates.y) % 2 == 0) {
        this.classList.add("dark-tile");
      } else {
        this.classList.add("light-tile");
      }
    }

    /**
     * @returns {Piece}
     */
    get piece() {
      return this[chessTileFields.piece];
    }

    /**
     * @param {Piece} piece
     */
    set piece(piece) {
      let newPieceFrom = null;

      if (this[chessTileFields.piece] instanceof Piece) {
        this[chessTileFields.piece][pieceFields.tile] = null;
      }

      if (piece instanceof Piece) {
        newPieceFrom = piece.coordinates;
      }

      this[chessTileFields.piece] = piece;


      if (piece instanceof Piece) {
        const newPieceTo = this.coordinates;

        this[chessTileFields.identifierHolder].textContent = piece.unicodeIdentifier;

        if (piece.tile instanceof ChessTile) {
          piece.tile.piece = null;
        }

        piece[pieceFields.tile] = this;

        piece.onMove(new PieceMoveEvent(newPieceFrom, newPieceTo));

        this.classList.add("has-piece");
      } else {
        this[chessTileFields.identifierHolder].textContent = "";

        this.classList.remove("has-piece");
      }
    }

    /**
     * @returns {PossibleMove}
     */
    get possibleMove() {
      return this[chessTileFields.possibleMove];
    }

    /**
     * @param {PossibleMove} possibleMove
     */
    set possibleMove(possibleMove) {
      if (possibleMove instanceof PossibleMove) {
        this[chessTileFields.possibleMove] = possibleMove;
        this.classList.add("possible-move");
      } else {
        this[chessTileFields.possibleMove] = null;
        this.classList.remove("possible-move");
      }
    }

    get [Symbol.toStringTag]() {
      return `ChessTile(${this.coordinates.toString()})`;
    }
  }
  window.customElements.define("chess-tile", ChessTile, { extends: "div" });

  const colours = {
    WHITE: Symbol("white"),
    BLACK: Symbol("black"),
  };

  const identifiers = {
    ROOK: Symbol("rook"),
    KNIGHT: Symbol("knight"),
    BISHOP: Symbol("bishop"),
    QUEEN: Symbol("queen"),
    KING: Symbol("king"),
    PAWN: Symbol("pawn"),
  };

  const identifiersUnicode = {
    [identifiers.ROOK]: {
      [colours.WHITE]: "♖",
      [colours.BLACK]: "♜",
    },
    [identifiers.KNIGHT]: {
      [colours.WHITE]: "♘",
      [colours.BLACK]: "♞",
    },
    [identifiers.BISHOP]: {
      [colours.WHITE]: "♗",
      [colours.BLACK]: "♝",
    },
    [identifiers.QUEEN]: {
      [colours.WHITE]: "♕",
      [colours.BLACK]: "♛",
    },
    [identifiers.KING]: {
      [colours.WHITE]: "♔",
      [colours.BLACK]: "♚",
    },
    [identifiers.PAWN]: {
      [colours.WHITE]: "♙",
      [colours.BLACK]: "♟︎",
    },
  };

  class IdentifierDefinition {
    constructor(identifierForWhite, identifierForBlack) {
      this[colours.WHITE] = identifierForWhite;
      this[colours.BLACK] = identifierForBlack;
    }

    get [Symbol.toStringTag]() {
      return `IdentifierDefinition(${this[colours.WHITE].toString()}, ${this[colours.BLACK].toString()})`;
    }
  }

  const coordinatesFields = {
    validateCoordinate: Symbol('validateCoordinate')
  };

  class Coordinates {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
      this.x = this[coordinatesFields.validateCoordinate]("x", x);
      this.y = this[coordinatesFields.validateCoordinate]("y", y);
    }

    /**
     * @param {string} name
     * @param {number} value
     * @returns {number}
     */
    [coordinatesFields.validateCoordinate](name, value) {
      if (value < 0 || value > 7) {
        throw new TypeError(
          `Coordinate ${name} must be between 0 and 7. Got ${value}.`
        );
      }
      return value;
    }

    get [Symbol.toStringTag]() {
      return `Coordinates(${this.x}, ${this.y})`;
    }
  }

  class PossibleMove {
    /**
     * @param {Piece} piece
     * @param {Coordinates} coordinates
     */
    constructor(piece, coordinates) {
      this.piece = piece;
      this.coordinates = coordinates;
    }
  }

  class PieceMoveEvent {
    /**
     * @param {Coordinates} from
     * @param {Coordinates} to
     */
    constructor(from, to) {
      this.from = from,
        this.to = to;
    }
  }

  const pieceFields = {
    tile: Symbol('tile'),
  };

  /**
   * @param {symbol} identifier
   * @param {symbol} colour
   */
  const Piece = function (identifier, colour) {
    this.identifier = identifier;
    this.colour = colour;
    this[pieceFields.tile] = null;
  };

  /**
   * @returns {Coordinates[]}
   */
  Piece.prototype.getMoves = function () {
    throw new TypeError(
      'The abstract "Piece" type doesn\'t support getMoves. You need to create your own type that inherits from "Piece".'
    );
  };

  /**
   * @param {PieceMoveEvent} moveEvent 
   */
  // eslint-disable-next-line no-unused-vars
  Piece.prototype.onMove = function (moveEvent) {
    // does nothing
  };

  Reflect.defineProperty(Piece.prototype, "tile", {
    enumerable: true,
    get: function () {
      return this[pieceFields.tile];
    },
    set: function () { throw new TypeError('Piece.tile may not be written to. Use ChessTile.piece instead.'); },
  });

  Reflect.defineProperty(Piece.prototype, "board", {
    enumerable: true,
    get: function () {
      if (this[pieceFields.tile] instanceof ChessTile) {
        return this[pieceFields.tile].board;
      }
      return null;
    },
    set: function () { throw new TypeError('Piece.board may not be written to.'); }
  });

  Reflect.defineProperty(Piece.prototype, "coordinates", {
    enumerable: true,
    get: function () {
      if (this[pieceFields.tile] instanceof ChessTile) {
        return this[pieceFields.tile].coordinates;
      }
      return null;
    },
    set: function () { throw new TypeError('Piece.coordinates may not be written to.'); }
  });

  Reflect.defineProperty(Piece.prototype, "isWhite", {
    enumerable: true,
    get: function () {
      return this.colour === colours.WHITE;
    },
    set: function () { throw new TypeError('Piece.isWhite may not be written to. Assign Piece.colour instead.'); }
  });

  Reflect.defineProperty(Piece.prototype, "isBlack", {
    enumerable: true,
    get: function () {
      return this.colour === colours.BLACK;
    },
    set: function () { throw new TypeError('Piece.isBlack may not be written to. Assign Piece.colour instead.'); }
  });

  Reflect.defineProperty(Piece.prototype, "unicodeIdentifier", {
    enumerable: true,
    get: function () {
      if (typeof this.identifier === "symbol") {
        return identifiersUnicode[this.identifier][this.colour];
      } else if (typeof this.identifier === "string") {
        return this.identifier;
      } else {
        return this.identifier[this.colour];
      }
    },
    set: function () { throw new TypeError('Piece.unicodeIdentifier may not be written to. Assign Piece.identifier instead.'); }
  });

  Reflect.defineProperty(Piece.prototype, "color", {
    enumerable: false,
    get: function () { return this.colour; },
    set: function (colour) { this.colour = colour; }
  });

  Reflect.defineProperty(Piece.prototype, Symbol.toStringTag, {
    get: function () {
      return `Piece(${this.identifier.toString()}, ${this.colour.toString()})`;
    }
  });

  return {
    Coordinates,
    Piece,
    IdentifierDefinition,
    identifiers,
    colours,
    colors: colours
  };
})(window);