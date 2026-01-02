export const getPieceSymbol = (piece: any): string => {
  if (!piece) return '';
  const symbols: any = {
    p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
    P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
  };
  const key = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
  return symbols[key] || '';
};

export const getSquareNotation = (row: number, col: number): string => {
  return String.fromCharCode(97 + col) + (8 - row);
};

export const isLightSquare = (row: number, col: number): boolean => {
  return (row + col) % 2 === 0;
};