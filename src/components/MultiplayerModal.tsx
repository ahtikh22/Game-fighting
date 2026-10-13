import React, { useState } from 'react';
import { GameMode, MultiplayerPlayer } from '../types/game';
import { soundEngine } from '../utils/audio';
import { Users, Wifi, Swords, Shield, Play, Copy, Check, X, Bot, Crown } from 'lucide-react';

interface Props {
  playerName: string;
  onStartMultiplayer: (mode: GameMode, roomCode: string, mapId: string) => void;
  onClose: () => void;
}

export const MultiplayerModal: React.FC<Props> = ({
  playerName,
  onStartMultiplayer,
  onClose,
}) => {
  const [mode, setMode] = useState<GameMode>('battle_royale');
  const [roomCode, setRoomCode] = useState<string>(() => `FF-${Math.floor(1000 + Math.random() * 9000)}`);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedMapId, setSelectedMapId] = useState<string>('bermuda');

  // Simulated lobby roster with real player and bots/allies
  const [players] = useState<MultiplayerPlayer[]>([
    {
      id: 'p_local',
      name: playerName || 'Survivor_Pro',
      gender: 'boy',
      characterId: 'hayato',
      weaponId: 'ak47',
      isHost: true,
      isReady: true,
      isBot: false,
      ping: 28,
      score: 1420,
      kills: 0,
      deaths: 0,
    },
    {
      id: 'p_2',
      name: 'Kelly_Striker',
      gender: 'girl',
      characterId: 'kelly',
      weaponId: 'mp40',
      isHost: false,
      isReady: true,
      isBot: true,
      ping: 34,
      score: 1200,
      kills: 0,
      deaths: 0,
    },
    {
      id: 'p_3',
      name: 'Shadow_Ninja',
      gender: 'boy',
      characterId: 'alok',
      weaponId: 'm4a1',
      isHost: false,
      isReady: true,
      isBot: true,
      ping: 42,
      score: 950,
      kills: 0,
      deaths: 0,
    },
    {
      id: 'p_4',
      name: 'Valkyrie_Rose',
      gender: 'girl',
      characterId: 'moco',
      weaponId: 'awm',
      isHost: false,
      isReady: true,
      isBot: true,
      ping: 25,
      score: 1680,
      kills: 0,
      deaths: 0,
    },
  ]);

  const copyRoomCode = () => {
    navigator.clipboard?.writeText(roomCode);
    setCopied(true);
    soundEngine.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-neutral-900 border-2 border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-neutral-900 via-neutral-800 to-amber-950/40 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500 flex items-center justify-center text-cyan-400 font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-chakra tracking-wider text-white uppercase">
                Multiplayer Battle Arena
              </h2>
              <p className="text-xs text-neutral-400">
                Play live Solo Battle Royale or 4v4 Squad Clash with custom room codes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 rounded-lg text-xs font-rajdhani text-emerald-400 border border-emerald-500/30">
              <Wifi className="w-3.5 h-3.5 animate-pulse" />
              <span>Server Online (Asia/Global)</span>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Mode & Room Setup */}
          <div className="md:col-span-5 p-6 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Game Modes */}
              <div>
                <label className="text-xs text-neutral-400 font-chakra uppercase font-bold tracking-wider mb-2 block">
                  Select Game Mode
                </label>
                <div className="space-y-2">
                  <div
                    onClick={() => {
                      soundEngine.playClick();
                      setMode('battle_royale');
                    }}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-center gap-3 ${
                      mode === 'battle_royale'
                        ? 'border-amber-400 bg-neutral-800 shadow-md'
                        : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-chakra font-bold text-white text-sm">
                        Solo Battle Royale (20 Survivors)
                      </h4>
                      <p className="text-xs text-neutral-400">
                        Drop in, loot houses, avoid the safe zone, be the last one standing!
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      soundEngine.playClick();
                      setMode('squad_tdm');
                    }}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-center gap-3 ${
                      mode === 'squad_tdm'
                        ? 'border-cyan-400 bg-neutral-800 shadow-md'
                        : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                      <Swords className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-chakra font-bold text-white text-sm">
                        4v4 Squad Clash Deathmatch
                      </h4>
                      <p className="text-xs text-neutral-400">
                        First team to reach 20 eliminations claims the Booyah!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Room Code */}
              <div>
                <label className="text-xs text-neutral-400 font-chakra uppercase font-bold tracking-wider mb-2 block">
                  Room Invite Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-lg text-center tracking-widest focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={copyRoomCode}
                    className="px-3 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition flex items-center gap-1.5 text-xs font-rajdhani font-bold"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                    <span>{copied ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
              </div>

              {/* Map Selection */}
              <div>
                <label className="text-xs text-neutral-400 font-chakra uppercase font-bold tracking-wider mb-2 block">
                  Battleground Map
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'bermuda', name: 'Bermuda Outpost' },
                    { id: 'desert', name: 'Kalahari Dunes' },
                    { id: 'cyber', name: 'Cyber Factory' },
                    { id: 'snow', name: 'Alpine Peak' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedMapId(m.id);
                      }}
                      className={`p-2.5 rounded-lg text-xs font-rajdhani font-bold border transition ${
                        selectedMapId === m.id
                          ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="mt-6 pt-4 border-t border-neutral-800">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onStartMultiplayer(mode, roomCode, selectedMapId);
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-chakra font-bold uppercase tracking-wider text-base shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Play className="w-5 h-5 fill-black" />
                <span>Launch Match</span>
              </button>
            </div>
          </div>

          {/* Lobby Squad Roster */}
          <div className="md:col-span-7 p-6 bg-neutral-950 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-chakra font-bold text-white text-base uppercase tracking-wider">
                  Squad Room Roster ({players.length}/4)
                </h3>
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-rajdhani font-bold">
                  <Check className="w-3.5 h-3.5" /> All Players Ready
                </span>
              </div>

              <div className="space-y-3">
                {players.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-amber-400">
                        {p.isBot ? <Bot className="w-5 h-5 text-neutral-400" /> : <Shield className="w-5 h-5 text-amber-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-chakra font-bold text-white text-sm">
                            {p.name}
                          </span>
                          {p.isHost && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">
                              HOST
                            </span>
                          )}
                          <span
                            className={`text-[10px] uppercase px-1.5 py-0.2 rounded font-bold ${
                              p.gender === 'boy' ? 'bg-blue-900/60 text-blue-300' : 'bg-rose-900/60 text-rose-300'
                            }`}
                          >
                            {p.gender}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400 font-rajdhani mt-0.5">
                          Loadout: <strong className="text-amber-400 uppercase">{p.weaponId}</strong> • Ping: {p.ping}ms
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-600/40 px-2.5 py-1 rounded-full font-bold font-rajdhani flex items-center gap-1">
                        <Check className="w-3 h-3" /> READY
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-xs text-neutral-400 leading-relaxed">
              <strong className="text-amber-400">Pro Tip:</strong> Enter houses to ambush opponents and pick up health kits and Gloo walls. When you shoot an opponent, aim for their head for instant 2x critical damage!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
