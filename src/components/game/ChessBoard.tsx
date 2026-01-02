import React from 'react';
import { getPieceSymbol, getSquareNotation, isLightSquare } from '@/utils/helpers';

interface ChessBoardProps {
  board: any[][];
  selectedSquare: string | null;
  validMoves: any[];
  onSquareClick: (row: number, col: number) => void;
}

export const ChessBoard = ({ board, selectedSquare, validMoves, onSquareClick }: ChessBoardProps) => (
  <div className="aspect-square shadow-xl rounded-xl overflow-hidden border-4 border-gray-800">
    {board.map((row: any, i: number) => (
      <div key={i} className="flex" style={{ height: '12.5%' }}>
        {row.map((piece: any, j: number) => {
          const square = getSquareNotation(i, j);
          const isLight = isLightSquare(i, j);
          const isSelected = selectedSquare === square;
          const isValidMove = validMoves.some((m: any) => m.to === square);
          
          return (
            <div
              key={j}
              onClick={() => onSquareClick(i, j)}
              className={`flex items-center justify-center cursor-pointer transition-all relative ${
                isLight ? 'bg-amber-100' : 'bg-amber-600'
              } ${isSelected ? 'ring-4 ring-blue-500 ring-inset' : ''}`}
              style={{ width: '12.5%' }}
            >
              {piece && (
                <span className={`text-4xl select-none ${
                  piece.color === 'w' ? 'filter drop-shadow-lg text-white stroke-black' : 'text-black'
                }`}>
                  {getPieceSymbol(piece)}
                </span>
              )}
              {isValidMove && (
                <div className={`absolute inset-0 flex items-center justify-center ${
                  piece ? 'bg-red-400 bg-opacity-30' : ''
                }`}>
                  {!piece && <div className="w-4 h-4 rounded-full bg-blue-500 opacity-60" />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    ))}
  </div>
);