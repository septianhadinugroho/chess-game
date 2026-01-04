import React from 'react';
import { getPieceSymbol, getSquareNotation, isLightSquare } from '@/utils/helpers';

interface ChessBoardProps {
  board: any[][];
  selectedSquare: string | null;
  validMoves: any[];
  onSquareClick: (row: number, col: number) => void;
}

export const ChessBoard = ({ board, selectedSquare, validMoves, onSquareClick }: ChessBoardProps) => {
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Board Labels - Files (a-h) */}
      <div className="flex justify-around px-2 mb-2">
        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file) => (
          <div key={file} className="w-[12.5%] text-center text-xs font-bold text-gray-500">
            {file}
          </div>
        ))}
      </div>

      {/* Chess Board */}
      <div className="bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-200 relative">
        {/* Board Grid */}
        <div className="aspect-square">
          {board.map((row: any, i: number) => (
            <div key={i} className="flex h-[12.5%]">
              {row.map((piece: any, j: number) => {
                const square = getSquareNotation(i, j);
                const isLight = isLightSquare(i, j);
                const isSelected = selectedSquare === square;
                const isValidMove = validMoves.some((m: any) => m.to === square);
                const canCapture = isValidMove && piece;
                
                return (
                  <button
                    key={j}
                    onClick={() => onSquareClick(i, j)}
                    className={`
                      flex items-center justify-center relative w-[12.5%] touch-feedback
                      transition-all duration-200 focus:outline-none
                      ${isLight 
                        ? 'bg-[#f0d9b5]' 
                        : 'bg-[#b58863]'
                      }
                      ${isSelected 
                        ? 'ring-4 ring-blue-500 ring-inset z-10 brightness-110' 
                        : ''
                      }
                      ${canCapture 
                        ? 'ring-4 ring-red-500 ring-inset' 
                        : ''
                      }
                      ${!piece && !isSelected && !isValidMove 
                        ? 'hover:brightness-95 active:brightness-90' 
                        : ''
                      }
                    `}
                    aria-label={`Square ${square}${piece ? `, ${piece.type}` : ''}`}
                  >
                    {/* Chess Piece */}
                    {piece && (
                      <span 
                        className={`
                          text-5xl md:text-6xl chess-piece pointer-events-none
                          transition-all duration-200
                          ${isSelected ? 'scale-110 animate-bounce-slow' : ''}
                          ${piece.color === 'w' 
                            ? 'drop-shadow-[0_3px_4px_rgba(0,0,0,0.4)]' 
                            : 'drop-shadow-[0_2px_3px_rgba(255,255,255,0.3)]'
                          }
                        `}
                      >
                        {getPieceSymbol(piece)}
                      </span>
                    )}
                    
                    {/* Valid Move Indicator */}
                    {isValidMove && !piece && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-4 h-4 rounded-full bg-blue-500 opacity-60 shadow-lg animate-pulse-slow" />
                      </div>
                    )}
                    
                    {/* Capture Indicator */}
                    {canCapture && (
                      <div className="absolute inset-0 bg-red-500 bg-opacity-20 pointer-events-none animate-pulse-slow" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Rank Labels - Inside Board */}
        <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-around py-2 pointer-events-none">
          {[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => (
            <div key={rank} className="h-[12.5%] flex items-center">
              <span className="text-xs font-bold text-gray-700 opacity-60">
                {rank}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Board Labels - Files (a-h) - Bottom */}
      <div className="flex justify-around px-2 mt-2">
        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file) => (
          <div key={file} className="w-[12.5%] text-center text-xs font-bold text-gray-500">
            {file}
          </div>
        ))}
      </div>
    </div>
  );
};