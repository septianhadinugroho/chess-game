import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  IoAdd, IoEnter, IoShareSocial, IoCopy, IoClose, 
  IoCheckmark, IoPeople, IoTime, IoRefresh, IoTrash, IoLink 
} from 'react-icons/io5';
import { FaChessKing, FaQuestion } from 'react-icons/fa'; 
import { translations, Language } from '@/lib/language';

interface Room {
  id: string;
  room_code: string;
  host_user_id: string;
  status: string;
  time_control: number;
  created_at: string;
  host_color: string;
}

interface MultiplayerLobbyProps {
  userId: string;
  language: Language;
  onJoinRoom: (roomId: string, roomCode: string) => void;
  onBack: () => void;
}

export default function MultiplayerLobby({ 
  userId, 
  language, 
  onJoinRoom, 
  onBack 
}: MultiplayerLobbyProps) {
  const t = translations[language];
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  
  // Create Room State
  const [timeControl, setTimeControl] = useState(600); // Default 10 menit
  const [selectedColor, setSelectedColor] = useState<'white' | 'black' | 'random'>('random');
  const [loading, setLoading] = useState(false);
  
  // Join Room State
  const [roomCode, setRoomCode] = useState('');
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  
  // Waiting Room State (Setelah Create)
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Time Presets
  const timePresets = [
    { value: 180, label: '3 min' },
    { value: 300, label: '5 min' },
    { value: 600, label: '10 min' },
    { value: 900, label: '15 min' },
  ];

  // Fetch rooms saat pindah ke tab Join
  useEffect(() => {
    if (activeTab === 'join') {
      fetchAvailableRooms();
    }
  }, [activeTab]);

  // Realtime Listener untuk Host di Waiting Room
  useEffect(() => {
    if (!createdRoom) return;

    // Subscribe ke perubahan di room ini
    const channel = supabase
      .channel(`room_waiting_${createdRoom.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'game_rooms', 
        filter: `id=eq.${createdRoom.id}` 
      }, (payload) => {
        const updatedRoom = payload.new as Room;
        
        // Jika status berubah jadi 'playing', berarti Guest sudah join!
        if (updatedRoom.status === 'playing') {
          // Masuk ke game
          onJoinRoom(updatedRoom.id, updatedRoom.room_code);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [createdRoom, onJoinRoom]);

  const fetchAvailableRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('status', 'waiting')
        .neq('host_user_id', userId) // Jangan tampilkan room sendiri
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAvailableRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const createRoom = async () => {
    setLoading(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Tentukan warna host sekarang biar jelas masuk DB
      const finalHostColor = selectedColor === 'random' 
        ? (Math.random() > 0.5 ? 'white' : 'black') 
        : selectedColor;
      
      const { data, error } = await supabase
        .from('game_rooms')
        .insert([{
          room_code: code,
          host_user_id: userId,
          host_color: finalHostColor,
          time_control: timeControl,
          white_time_left: timeControl,
          black_time_left: timeControl,
          status: 'waiting',
          is_paused: false, // Kolom baru untuk fitur pause
          current_fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        }])
        .select()
        .single();

      if (error) throw error;

      // JANGAN LANGSUNG JOIN GAME! Masuk ke Waiting State dulu.
      setCreatedRoom(data);

    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  const deleteRoom = async () => {
    if (!createdRoom) return;
    
    // Konfirmasi sebelum hapus
    const confirmDelete = confirm(
      language === 'id' 
        ? 'Batalkan dan hapus room ini?' 
        : 'Cancel and delete this room?'
    );
    
    if (!confirmDelete) return;
    
    setLoading(true);
    try {
      // Hapus dari database
      const { error } = await supabase
        .from('game_rooms')
        .delete()
        .eq('id', createdRoom.id)
        .eq('host_user_id', userId); // Security check
      
      if (error) throw error;
      
      // Reset state, kembali ke menu create
      setCreatedRoom(null);
      
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Failed to delete room.');
    } finally {
      setLoading(false);
    }
  }

  const joinRoom = async (code: string) => {
    if (!userId) return;
    setLoading(true);

    try {
      // 1. Cari Room
      const { data: roomData, error: fetchError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', code.toUpperCase())
        .eq('status', 'waiting')
        .single();

      if (fetchError || !roomData) {
        alert(language === 'id' ? 'Room tidak ditemukan atau penuh!' : 'Room not found or full!');
        return;
      }

      // 2. Cek Host (Gak boleh join room sendiri di tab Join)
      if (roomData.host_user_id === userId) {
        alert(language === 'id' ? 'Anda host room ini (Tunggu di lobi)' : 'You are the host (Wait in lobby)');
        return;
      }

      // 3. Update Database: Masukkan Guest & Ubah Status jadi Playing
      const { error: updateError } = await supabase
        .from('game_rooms')
        .update({ 
          guest_user_id: userId,
          status: 'playing'
        })
        .eq('id', roomData.id);

      if (updateError) throw updateError;

      // 4. Guest Langsung Masuk Game
      onJoinRoom(roomData.id, code.toUpperCase());

    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join room.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, isLink = false) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareRoom = () => {
    if (!createdRoom) return;
    const url = `${window.location.origin}?room=${createdRoom.room_code}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Chess Master - Join my game!',
        text: `Join my chess game with code: ${createdRoom.room_code}`,
        url: url
      });
    } else {
      copyToClipboard(url, true);
    }
  };

  // --- UI: WAITING ROOM (Saat Host sudah create room) ---
  if (createdRoom) {
    const shareUrl = `${window.location.origin}?room=${createdRoom.room_code}`;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="card text-center animate-slide-up">
            
            {/* Animasi Loading */}
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse relative">
              <IoTime className="text-4xl text-blue-500" />
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping opacity-20"></div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {language === 'id' ? 'Menunggu Lawan...' : 'Waiting for Opponent...'}
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              {language === 'id' 
                ? 'Bagikan kode ini ke temanmu untuk mulai main' 
                : 'Share this code with your friend to start'}
            </p>

            {/* Room Code Display */}
            <div className="bg-gray-100 p-5 rounded-2xl mb-6 relative border border-gray-200">
              <p className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-widest">
                {language === 'id' ? 'Kode Room' : 'Room Code'}
              </p>
              <div className="text-5xl font-black text-blue-600 tracking-widest font-mono">
                {createdRoom.room_code}
              </div>
              
              <button
                onClick={() => copyToClipboard(createdRoom.room_code)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                title="Copy Code"
              >
                {copied ? <IoCheckmark size={20} /> : <IoCopy size={20} />}
              </button>
            </div>

            {/* Room Info Details */}
            <div className="flex justify-center gap-3 mb-8">
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-sm text-blue-800">
                {createdRoom.host_color === 'white' 
                  ? <FaChessKing className="text-gray-400 stroke-1" /> // Putih
                  : <FaChessKing className="text-black" /> // Hitam
                }
                <span className="font-bold">
                  {language === 'id' 
                    ? (createdRoom.host_color === 'white' ? 'Putih' : 'Hitam') 
                    : (createdRoom.host_color === 'white' ? 'White' : 'Black')}
                </span>
              </div>
              
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 text-sm text-emerald-800">
                <IoTime />
                <span className="font-bold">{createdRoom.time_control / 60} min</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => copyToClipboard(shareUrl, true)}
                className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-cyan-100 text-cyan-600 rounded-xl font-bold hover:bg-cyan-50 transition-all"
              >
                {copiedLink ? <IoCheckmark /> : <IoLink />}
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
              
              <button
                onClick={shareRoom}
                className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                <IoShareSocial />
                Share
              </button>
            </div>

            <button
              onClick={deleteRoom}
              disabled={loading}
              className="w-full py-4 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'Deleting...' : (
                <>
                  <IoTrash /> {language === 'id' ? 'Batalkan Room' : 'Cancel Room'}
                </>
              )}
            </button>

          </div>
        </div>
      </div>
    );
  }

  // --- UI: MENU UTAMA (Create / Join Tabs) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 pb-6">
      <div className="bg-gradient-to-br from-emerald-500 to-green-500 p-4 mb-4 shadow-lg">
        <div className="max-w-lg mx-auto">
          <button
            onClick={onBack}
            className="text-white hover:bg-white/20 px-3 py-2 rounded-xl transition-colors mb-3 flex items-center gap-2 font-bold text-sm"
          >
            ← {language === 'id' ? 'Kembali' : 'Back'}
          </button>
          
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-1 drop-shadow-md">
              {language === 'id' ? 'Multiplayer Online' : 'Online Multiplayer'}
            </h1>
            <p className="text-emerald-100 text-xs font-medium">
              {language === 'id' ? 'Main dengan teman atau pemain lain' : 'Play with friends or other players'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* TAB SWITCHER */}
        <div className="bg-gray-100 p-1 rounded-2xl flex mb-6">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm ${
              activeTab === 'create'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            <IoAdd size={18} />
            {language === 'id' ? 'Buat Room' : 'Create Room'}
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm ${
              activeTab === 'join'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            <IoEnter size={18} />
            {language === 'id' ? 'Join Room' : 'Join Room'}
          </button>
        </div>

        {/* TAB: CREATE ROOM */}
        {activeTab === 'create' && (
          <div className="card animate-slide-up space-y-6">
            
            {/* 1. Time Control Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
                ⏱️ {language === 'id' ? 'Waktu' : 'Time Control'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {timePresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setTimeControl(preset.value)}
                    className={`py-2 rounded-xl font-bold transition-all text-xs border-2 ${
                      timeControl === preset.value
                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Color Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
                ♟️ {language === 'id' ? 'Pilih Warna' : 'Choose Color'}
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setSelectedColor('white')} 
                  className={`flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all ${
                    selectedColor === 'white' 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <FaChessKing className="text-2xl text-gray-400 stroke-1" />
                  <span className="text-xs font-bold text-gray-700">White</span>
                </button>
                
                <button 
                  onClick={() => setSelectedColor('random')} 
                  className={`flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all ${
                    selectedColor === 'random' 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <FaQuestion className="text-2xl text-gray-600" />
                  <span className="text-xs font-bold text-gray-700">Random</span>
                </button>
                
                <button 
                  onClick={() => setSelectedColor('black')} 
                  className={`flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all ${
                    selectedColor === 'black' 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <FaChessKing className="text-2xl text-black" />
                  <span className="text-xs font-bold text-gray-700">Black</span>
                </button>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={createRoom}
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white py-4 rounded-2xl font-bold hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                <>
                  <IoAdd size={24} />
                  {language === 'id' ? 'Buat Room' : 'Create Room'}
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB: JOIN ROOM */}
        {activeTab === 'join' && (
          <div className="space-y-4 animate-slide-up">
            <div className="card">
              <h3 className="font-bold text-base text-gray-800 mb-3">
                {language === 'id' ? 'Masukkan Kode Room' : 'Enter Room Code'}
              </h3>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ABC123"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 bg-gray-100 border-2 border-transparent focus:border-blue-500 rounded-xl font-bold text-center text-xl tracking-widest uppercase focus:outline-none"
                  maxLength={6}
                />
                <button
                  onClick={() => joinRoom(roomCode)}
                  disabled={loading || roomCode.length !== 6}
                  className="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Join
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 mt-6 mb-2">
              <h3 className="font-bold text-gray-700 text-sm">
                {language === 'id' ? 'Room Tersedia' : 'Available Rooms'}
              </h3>
              <button 
                onClick={fetchAvailableRooms}
                className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                aria-label={language === 'id' ? 'Refresh Daftar Room' : 'Refresh Room List'}
              >
                <IoRefresh size={20} />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pb-10">
              {availableRooms.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <IoPeople className="text-4xl text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm font-medium">
                    {language === 'id' ? 'Belum ada room aktif' : 'No active rooms found'}
                  </p>
                </div>
              ) : (
                availableRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => joinRoom(room.room_code)}
                    className="w-full p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-black text-gray-800 text-xl tracking-wider mb-1 group-hover:text-blue-600 transition-colors">
                          {room.room_code}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                          <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
                            <IoTime size={10} /> {room.time_control / 60}m
                          </span>
                          <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
                             Host: {room.host_color}
                          </span>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <IoEnter size={20} />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}