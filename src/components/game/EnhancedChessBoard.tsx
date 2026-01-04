import React, { useState, useEffect } from 'react';
import { getPieceSymbol, getSquareNotation, isLightSquare } from '@/utils/helpers';
import { IoTimerOutline } from 'react-icons/io5';

interface Move {
  from: string;
  to: string;
  flags?: string;
}

interface EnhancedChessBoardProps {
  board: any[][];
  selectedSquare: string | null;
  validMoves: any[];
  onSquareClick: (row: number, col: number) => void;
  orientation?: 'white' | 'black';
  lastMove?: { from: string; to: string } | null;
  showTimer?: boolean;
  whiteTime?: number;
  blackTime?: number;
  currentTurn?: 'w' | 'b';
}

export default function EnhancedChessBoard({ 
  board, 
  selectedSquare, 
  validMoves, 
  onSquareClick,
  orientation = 'white',
  lastMove = null,
  showTimer = false,
  whiteTime = 600,
  blackTime = 600,
  currentTurn = 'w'
}: EnhancedChessBoardProps) {
  
  const isBlack = orientation === 'black';
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const displayFiles = isBlack ? [...files].reverse() : files;
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
  const displayRanks = isBlack ? [...ranks].reverse() : ranks;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLastMoveSquare = (square: string) => {
    if (!lastMove) return false;
    return square === lastMove.from || square === lastMove.to;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Timer - Black Player */}
      {showTimer && (
        <div className={`mb-3 p-3 rounded-2xl flex items-center justify-between transition-all ${
          currentTurn === 'b' 
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          <div className="flex items-center gap-2">
            <IoTimerOutline size={20} />
            <span className="font-bold text-sm">Black</span>
          </div>
          <span className="text-2xl font-black font-mono">{formatTime(blackTime)}</span>
        </div>
      )}

      {/* Files Label Top */}
      <div className="flex justify-around px-2 mb-2">
        {displayFiles.map((file) => (
          <div key={file} className="w-[12.5%] text-center text-xs font-bold text-gray-500">
            {file}
          </div>
        ))}
      </div>

      {/* Chess Board */}
      <div className="bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-200 relative">
        <div className="aspect-square">
          {board.map((_, visualRow) => {
            return (
              <div key={visualRow} className="flex h-[12.5%]">
                {board[visualRow].map((_, visualCol) => {
                  const i = isBlack ? 7 - visualRow : visualRow;
                  const j = isBlack ? 7 - visualCol : visualCol;
                  
                  const piece = board[i][j];
                  const square = getSquareNotation(i, j);
                  const isLight = isLightSquare(i, j);
                  
                  const isSelected = selectedSquare === square;
                  const isValidMove = validMoves.some((m: any) => m.to === square);
                  const canCapture = isValidMove && piece;
                  const isLastMove = isLastMoveSquare(square);

                  // Detect special moves
                  const selectedMove = validMoves.find((m: any) => m.from === selectedSquare && m.to === square);
                  const isCastle = selectedMove?.flags?.includes('k') || selectedMove?.flags?.includes('q');
                  const isEnPassant = selectedMove?.flags?.includes('e');

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
                        ${isLastMove 
                          ? 'bg-yellow-300 bg-opacity-50' 
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

                      {/* Castle Indicator */}
                      {isCastle && (
                        <div className="absolute top-0 right-0 bg-purple-500 text-white text-[8px] px-1 rounded-bl font-bold pointer-events-none">
                          🏰
                        </div>
                      )}

                      {/* En Passant Indicator */}
                      {isEnPassant && (
                        <div className="absolute top-0 right-0 bg-orange-500 text-white text-[8px] px-1 rounded-bl font-bold pointer-events-none">
                          EP
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Rank Labels */}
        <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-around py-2 pointer-events-none">
          {displayRanks.map((rank) => (
            <div key={rank} className="h-[12.5%] flex items-center">
              <span className="text-xs font-bold text-gray-700 opacity-60">
                {rank}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Files Label Bottom */}
      <div className="flex justify-around px-2 mt-2">
        {displayFiles.map((file) => (
          <div key={file} className="w-[12.5%] text-center text-xs font-bold text-gray-500">
            {file}
          </div>
        ))}
      </div>

      {/* Timer - White Player */}
      {showTimer && (
        <div className={`mt-3 p-3 rounded-2xl flex items-center justify-between transition-all ${
          currentTurn === 'w' 
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          <div className="flex items-center gap-2">
            <IoTimerOutline size={20} />
            <span className="font-bold text-sm">White</span>
          </div>
          <span className="text-2xl font-black font-mono">{formatTime(whiteTime)}</span>
        </div>
      )}
    </div>
  );
}