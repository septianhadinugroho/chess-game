import { PIECE_SYMBOLS } from '@/constants/game-config';

export const getPieceSymbol = (piece: any): string => {
  if (!piece) return '';
  const key = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
  return PIECE_SYMBOLS[key as keyof typeof PIECE_SYMBOLS] || '';
};

export const getSquareNotation = (row: number, col: number): string => {
  return String.fromCharCode(97 + col) + (8 - row);
};

export const isLightSquare = (row: number, col: number): boolean => {
  return (row + col) % 2 === 0;
};

export const getRandomColor = (): 'white' | 'black' => {
  return Math.random() > 0.5 ? 'white' : 'black';
};