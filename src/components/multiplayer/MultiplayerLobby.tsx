import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  IoAdd, IoEnter, IoShareSocial, IoCopy, IoClose, 
  IoCheckmark, IoPeople, IoTime, IoRefresh 
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
  const [timeControl, setTimeControl] = useState(600); // 10 minutes
  const [roomCode, setRoomCode] = useState('');
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState('');
  const [copied, setCopied] = useState(false);

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
      // Generate room code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data, error } = await supabase
        .from('game_rooms')
        .insert([{
          room_code: code,
          host_user_id: userId,
          time_control: timeControl,
          white_time_left: timeControl,
          black_time_left: timeControl,
          status: 'waiting'
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCreatedRoomCode(code);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (code: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', code.toUpperCase())
        .eq('status', 'waiting')
        .single();

      if (error || !data) {
        alert(language === 'id' ? 'Room tidak ditemukan!' : 'Room not found!');
        return;
      }

      // Update room dengan guest
      await supabase
        .from('game_rooms')
        .update({ 
          guest_user_id: userId,
          status: 'playing'
        })
        .eq('id', data.id);

      onJoinRoom(data.id, code.toUpperCase());
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      copyToClipboard(url);
    }
  };

  if (createdRoomCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="card text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-bounce-slow shadow-xl">
              <IoCheckmark className="text-5xl text-white" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {language === 'id' ? 'Room Siap!' : 'Room Ready!'}
            </h2>
            <p className="text-gray-600 mb-6">
              {language === 'id' 
                ? 'Bagikan kode ini ke temanmu' 
                : 'Share this code with your friend'}
            </p>

            <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl p-6 mb-6">
              <div className="text-sm text-gray-600 mb-2 font-medium">
                {language === 'id' ? 'Kode Room' : 'Room Code'}
              </div>
              <div className="text-5xl font-black text-blue-600 tracking-widest mb-4 font-mono">
                {createdRoomCode}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(createdRoomCode)}
                  className="flex-1 bg-white border-2 border-blue-200 text-blue-600 py-3 rounded-xl font-bold hover:shadow-md transition-all flex items-center justify-center gap-2 touch-feedback"
                >
                  {copied ? <IoCheckmark size={20} /> : <IoCopy size={20} />}
                  {copied 
                    ? (language === 'id' ? 'Tersalin!' : 'Copied!') 
                    : (language === 'id' ? 'Salin Kode' : 'Copy Code')}
                </button>
                
                <button
                  onClick={shareRoom}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 touch-feedback"
                >
                  <IoShareSocial size={20} />
                  {language === 'id' ? 'Share' : 'Share'}
                </button>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-200 mb-6">
              <div className="flex items-start gap-3">
                <IoTime className="text-yellow-600 text-xl shrink-0 mt-0.5" />
                <div className="text-left">
                  <div className="font-bold text-sm text-gray-800 mb-1">
                    {language === 'id' ? 'Menunggu Pemain...' : 'Waiting for Player...'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {language === 'id' 
                      ? 'Game akan dimulai saat pemain lain join' 
                      : 'Game will start when another player joins'}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setCreatedRoomCode('');
                onBack();
              }}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <IoClose size={20} />
              {language === 'id' ? 'Batal' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 pb-6">
      <div className="bg-gradient-to-br from-emerald-500 to-green-500 p-6 mb-4 shadow-lg">
        <div className="max-w-lg mx-auto">
          <button
            onClick={onBack}
            className="text-white hover:bg-white/20 px-3 py-2 rounded-xl transition-colors mb-4 flex items-center gap-2 font-bold"
          >
            ← {language === 'id' ? 'Kembali' : 'Back'}
          </button>
          
          <div className="text-center text-white">
            <h1 className="text-3xl font-bold mb-2 drop-shadow-md">
              {language === 'id' ? 'Multiplayer Online' : 'Online Multiplayer'}
            </h1>
            <p className="text-emerald-100 text-sm font-medium">
              {language === 'id' ? 'Main dengan teman atau pemain lain' : 'Play with friends or other players'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* Tabs */}
        <div className="bg-gray-100 p-1.5 rounded-2xl flex mb-4">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'create'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            <IoAdd size={20} />
            {language === 'id' ? 'Buat Room' : 'Create Room'}
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'join'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            <IoEnter size={20} />
            {language === 'id' ? 'Join Room' : 'Join Room'}
          </button>
        </div>

        {/* Create Room Tab */}
        {activeTab === 'create' && (
          <div className="card animate-slide-up">
            <h3 className="font-bold text-lg text-gray-800 mb-4">
              {language === 'id' ? 'Buat Room Baru' : 'Create New Room'}
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {language === 'id' ? 'Waktu per Pemain' : 'Time per Player'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[300, 600, 900].map((time) => (
                  <button
                    key={time}
                    onClick={() => setTimeControl(time)}
                    className={`p-3 rounded-xl font-bold transition-all ${
                      timeControl === time
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {time / 60} {language === 'id' ? 'menit' : 'min'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={createRoom}
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white py-4 rounded-2xl font-bold hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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

        {/* Join Room Tab */}
        {activeTab === 'join' && (
          <div className="space-y-4 animate-slide-up">
            <div className="card">
              <h3 className="font-bold text-lg text-gray-800 mb-4">
                {language === 'id' ? 'Masukkan Kode Room' : 'Enter Room Code'}
              </h3>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ABC123"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-bold text-center text-2xl tracking-widest uppercase focus:border-blue-500 focus:outline-none"
                  maxLength={6}
                />
                <button
                  onClick={() => joinRoom(roomCode)}
                  disabled={loading || roomCode.length !== 6}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
                  aria-label={language === 'id' ? 'Masuk Room' : 'Join Room'} // FIX: Added aria-label
                >
                  <IoEnter size={24} />
                </button>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-800">
                  {language === 'id' ? 'Room Tersedia' : 'Available Rooms'}
                </h3>
                <button
                  onClick={fetchAvailableRooms}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-blue-500"
                  aria-label={language === 'id' ? 'Refresh Room' : 'Refresh Rooms'} // FIX: Added aria-label
                >
                  <IoRefresh size={20} />
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
                      className="w-full p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl hover:shadow-md transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-800 text-lg mb-1">
                            {room.room_code}
                          </div>
                          <div className="text-xs text-gray-600 flex items-center gap-2">
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