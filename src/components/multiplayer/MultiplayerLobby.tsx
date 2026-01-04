import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  IoAdd, IoEnter, IoShareSocial, IoCopy, IoClose, 
  IoCheckmark, IoPeople, IoTime, IoRefresh, IoTrash, IoLink 
} from 'react-icons/io5';
import { translations, Language } from '@/lib/language';

interface Room {
  id: string;
  room_code: string;
  host_user_id: string;
  status: string;
  time_control: number;
  created_at: string;
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
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [timeControl, setTimeControl] = useState(300); // 5 minutes default
  const [customTime, setCustomTime] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const timePresets = [
    { value: 180, label: '3 min' },
    { value: 300, label: '5 min' },
    { value: 600, label: '10 min' },
    { value: 900, label: '15 min' },
  ];

  useEffect(() => {
    if (activeTab === 'join') {
      fetchAvailableRooms();
    }
  }, [activeTab]);

  const fetchAvailableRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('status', 'waiting')
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
      const finalTime = customTime ? parseInt(customTime) * 60 : timeControl;
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const hostColor = Math.random() > 0.5 ? 'white' : 'black';
      
      const { data, error } = await supabase
        .from('game_rooms')
        .insert([{
          room_code: code,
          host_user_id: userId,
          host_color: hostColor,
          time_control: finalTime,
          white_time_left: finalTime,
          black_time_left: finalTime,
          status: 'waiting',
          current_fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        }])
        .select()
        .single();

      if (error) throw error;

      onJoinRoom(data.id, code);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  const deleteRoom = async () => {
    if (!createdRoomId) return;
    
    const confirmDelete = confirm(
      language === 'id' 
        ? 'Yakin ingin menghapus room ini?' 
        : 'Are you sure you want to delete this room?'
    );
    
    if (!confirmDelete) return;
    
    setLoading(true);
    try {
      // Delete dari database
      const { error } = await supabase
        .from('game_rooms')
        .delete()
        .eq('id', createdRoomId)
        .eq('host_user_id', userId); // Security: pastikan hanya host yang bisa delete
      
      if (error) throw error;
      
      // Reset state
      setCreatedRoomId('');
      setCreatedRoomCode('');
      
      // Show success message
      alert(
        language === 'id' 
          ? 'Room berhasil dihapus!' 
          : 'Room deleted successfully!'
      );
      
      // Kembali ke menu create
      setActiveTab('create');
    } catch (error) {
      console.error('Error deleting room:', error);
      alert(
        language === 'id' 
          ? 'Gagal menghapus room. Silakan coba lagi.' 
          : 'Failed to delete room. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  // Di bagian function joinRoom
  const joinRoom = async (code: string) => {
    if (!userId) return; // Udah dijamin ada sama useAuth
    setLoading(true);

    try {
      // 1. Cari Room
      const { data: roomData, error: fetchError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', code.toUpperCase())
        .eq('status', 'waiting') // Pastikan status masih waiting
        .single();

      if (fetchError || !roomData) {
        alert(language === 'id' ? 'Room tidak ditemukan atau sudah penuh!' : 'Room not found or full!');
        setLoading(false);
        return;
      }

      // 2. Cek Host
      if (roomData.host_user_id === userId) {
        alert('Gabisa join room sendiri!');
        setLoading(false);
        return;
      }

      // 3. UPDATE Database (Sekarang pasti berhasil karena Constraint udah dicopot)
      const { error: updateError } = await supabase
        .from('game_rooms')
        .update({ 
          guest_user_id: userId, // ID Text (misal: guest_8a2b1c) masuk lancar
          status: 'playing'      // Ubah status jadi playing
        })
        .eq('id', roomData.id);

      if (updateError) throw updateError;

      // 4. Masuk ke Game
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
    const url = `${window.location.origin}?room=${createdRoomCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'Chess Master - Join my game!',
        text: `Join my chess game with code: ${createdRoomCode}`,
        url: url
      });
    } else {
      copyToClipboard(url, true);
    }
  };

  if (createdRoomCode) {
    const shareUrl = `${window.location.origin}?room=${createdRoomCode}`;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="card text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce-slow shadow-xl">
              <IoCheckmark className="text-4xl text-white" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {language === 'id' ? 'Room Siap!' : 'Room Ready!'}
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              {language === 'id' 
                ? 'Bagikan kode atau link ke temanmu' 
                : 'Share code or link to your friend'}
            </p>

            <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl p-4 mb-4">
              <div className="text-xs text-gray-600 mb-1 font-medium">
                {language === 'id' ? 'Kode Room' : 'Room Code'}
              </div>
              <div className="text-4xl font-black text-blue-600 tracking-widest mb-3 font-mono">
                {createdRoomCode}
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  onClick={() => copyToClipboard(createdRoomCode)}
                  className="bg-white border-2 border-blue-200 text-blue-600 py-2 rounded-xl font-bold hover:shadow-md transition-all flex items-center justify-center gap-1 text-xs"
                >
                  {copied ? <IoCheckmark size={16} /> : <IoCopy size={16} />}
                  <span className="hidden sm:inline">{copied ? 'OK!' : 'Code'}</span>
                </button>
                
                <button
                  onClick={() => copyToClipboard(shareUrl, true)}
                  className="bg-white border-2 border-cyan-200 text-cyan-600 py-2 rounded-xl font-bold hover:shadow-md transition-all flex items-center justify-center gap-1 text-xs"
                >
                  {copiedLink ? <IoCheckmark size={16} /> : <IoLink size={16} />}
                  <span className="hidden sm:inline">{copiedLink ? 'OK!' : 'Link'}</span>
                </button>
                
                <button
                  onClick={shareRoom}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-1 text-xs"
                >
                  <IoShareSocial size={16} />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>

              <p className="text-xs text-gray-500">
                {language === 'id' ? 'Link:' : 'Link:'} <span className="font-mono text-blue-600 break-all">{shareUrl}</span>
              </p>
            </div>

            <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200 mb-4">
              <div className="flex items-start gap-2">
                <IoTime className="text-yellow-600 text-lg shrink-0 mt-0.5" />
                <div className="text-left">
                  <div className="font-bold text-xs text-gray-800 mb-0.5">
                    {language === 'id' ? 'Menunggu Pemain...' : 'Waiting for Player...'}
                  </div>
                  <div className="text-[10px] text-gray-600">
                    {language === 'id' 
                      ? 'Game akan dimulai saat pemain lain join' 
                      : 'Game will start when another player joins'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={deleteRoom}
                disabled={loading}
                className="flex-1 bg-red-100 text-red-600 py-3 rounded-xl font-bold hover:bg-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent"></div>
                ) : (
                  <>
                    <IoTrash size={18} />
                    {language === 'id' ? 'Hapus Room' : 'Delete Room'}
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setCreatedRoomCode('');
                  setCreatedRoomId('');
                }}
                disabled={loading}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <IoClose size={18} />
                {language === 'id' ? 'Tutup' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="bg-gray-100 p-1 rounded-2xl flex mb-4">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm ${
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
            className={`flex-1 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm ${
              activeTab === 'join'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            <IoEnter size={18} />
            {language === 'id' ? 'Join Room' : 'Join Room'}
          </button>
        </div>

        {activeTab === 'create' && (
          <div className="card animate-slide-up">
            <h3 className="font-bold text-base text-gray-800 mb-3">
              {language === 'id' ? 'Buat Room Baru' : 'Create New Room'}
            </h3>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                <IoTime size={14} />
                {language === 'id' ? 'Waktu per Pemain' : 'Time per Player'}
              </label>
              <p className="text-[10px] text-gray-500 mb-2">
                {language === 'id' 
                  ? 'Total waktu yang dimiliki setiap pemain untuk semua langkah mereka' 
                  : 'Total time each player has for all their moves'}
              </p>
              
              <div className="grid grid-cols-4 gap-2 mb-2">
                {timePresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => {
                      setTimeControl(preset.value);
                      setCustomTime('');
                    }}
                    className={`p-2 rounded-xl font-bold transition-all text-xs ${
                      timeControl === preset.value && !customTime
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="number"
                  placeholder={language === 'id' ? 'Custom (menit)' : 'Custom (min)'}
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl font-bold text-center text-sm focus:border-blue-500 focus:outline-none"
                  min="1"
                  max="60"
                />
              </div>
            </div>

            <button
              onClick={createRoom}
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white py-3 rounded-2xl font-bold hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  {language === 'id' ? 'Membuat...' : 'Creating...'}
                </>
              ) : (
                <>
                  <IoAdd size={20} />
                  {language === 'id' ? 'Buat Room' : 'Create Room'}
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === 'join' && (
          <div className="space-y-4 animate-slide-up">
            <div className="card">
              <h3 className="font-bold text-base text-gray-800 mb-3">
                {language === 'id' ? 'Masukkan Kode Room' : 'Enter Room Code'}
              </h3>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="ABC123"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl font-bold text-center text-lg sm:text-xl tracking-widest uppercase focus:border-blue-500 focus:outline-none"
                  maxLength={6}
                />
                <button
                  onClick={() => joinRoom(roomCode)}
                  disabled={loading || roomCode.length !== 6}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 sm:py-0 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                  aria-label={language === 'id' ? 'Masuk Room' : 'Join Room'}
                >
                  <IoEnter size={20} />
                  <span className="sm:hidden">{language === 'id' ? 'Join' : 'Join'}</span>
                </button>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base text-gray-800">
                  {language === 'id' ? 'Room Tersedia' : 'Available Rooms'}
                </h3>
                <button
                  onClick={fetchAvailableRooms}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-blue-500"
                  aria-label={language === 'id' ? 'Refresh Room' : 'Refresh Rooms'}
                >
                  <IoRefresh size={18} />
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableRooms.length === 0 ? (
                  <div className="text-center py-8">
                    <IoPeople className="text-5xl text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      {language === 'id' ? 'Belum ada room tersedia' : 'No rooms available'}
                    </p>
                  </div>
                ) : (
                  availableRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => joinRoom(room.room_code)}
                      className="w-full p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl hover:shadow-md transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-800 text-base mb-0.5">
                            {room.room_code}
                          </div>
                          <div className="text-xs text-gray-600 flex items-center gap-1">
                            <IoTime size={12} />
                            {room.time_control / 60} {language === 'id' ? 'menit' : 'min'}
                          </div>
                        </div>
                        <IoEnter className="text-blue-500 text-2xl" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}