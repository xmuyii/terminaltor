import React, { useState, useEffect, useRef } from 'react';
import {
  Satellite,
  Radio,
  Radar,
  Globe,
  Compass,
  Signal,
  Wifi,
  Send,
  Shield,
  Zap,
  Skull,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Disc,
  Sparkles,
  RefreshCw,
  Terminal,
} from 'lucide-react';

export interface SectorBeaconMessage {
  id: string;
  sender: string;
  callsign: string;
  sector: string;
  frequency: string;
  distanceKm: string;
  signalStrength: number; // 1 to 5
  type: 'beacon' | 'intercept' | 'telemetry' | 'distress' | 'broadcast' | 'uplink';
  role: 'striker' | 'tactician' | 'debugger' | 'sentinel' | 'player' | 'satellite' | 'probe';
  text: string;
  timestamp: string;
  isCombatAlert?: boolean;
  avatarColor: string;
}

// Initial deep sector intercepted beacon messages
const INITIAL_BEACON_SIGNALS: SectorBeaconMessage[] = [
  {
    id: 'bcn_1',
    sender: 'Orbital Array Alpha',
    callsign: 'OseConstellation',
    sector: 'LEO Orbit // Sector 00',
    frequency: '1420.405 MHz',
    distanceKm: '420 km',
    signalStrength: 5,
    type: 'telemetry',
    role: 'satellite',
    text: 'Orbital satellite array locked on primary grid. Calibrating deep space receivers across 8 sectors.',
    timestamp: 'Just now',
    avatarColor: 'from-cyan-400 to-blue-500',
  },
  {
    id: 'bcn_2',
    sender: 'Kyoto Deep Station',
    callsign: 'RoninRelay',
    sector: 'Sector 07 [Kyoto Quadrant]',
    frequency: '92.40 GHz',
    distanceKm: '12,400 km',
    signalStrength: 4,
    type: 'intercept',
    role: 'striker',
    text: 'Intercepted encrypted byte stream from deep sector perimeter. WordForge resonance frequency spiking +140 pts.',
    timestamp: 'Just now',
    avatarColor: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'bcn_3',
    sender: 'Lagos Matrix Relay',
    callsign: 'SolarPulse',
    sector: 'Sector 12 [Lagos Hub]',
    frequency: '2.40 THz',
    distanceKm: '8,200 km',
    signalStrength: 5,
    type: 'broadcast',
    role: 'tactician',
    text: 'High-gain dish beaming compiler telemetry to your terminal. Outer firewall holds firm.',
    timestamp: '1m ago',
    avatarColor: 'from-amber-400 to-orange-500',
  },
  {
    id: 'bcn_4',
    sender: 'Deep Probe Echo-9',
    callsign: 'AutomatedProbe',
    sector: 'Deep Void [Sector 0x8F]',
    frequency: '32.10 MHz',
    distanceKm: '1,420,000 km',
    signalStrength: 2,
    type: 'beacon',
    role: 'probe',
    text: '...- - -... Vast beacon pulse detected at outer fringe. Terminaltor memory loop breach imminent.',
    timestamp: '2m ago',
    isCombatAlert: true,
    avatarColor: 'from-purple-400 to-pink-500',
  },
];

// Vast catalog of distant sector transmissions and automated beacons
const DISTANT_BEACONS: Array<Omit<SectorBeaconMessage, 'id' | 'timestamp'>> = [
  {
    sender: 'Deep Probe Echo-9',
    callsign: 'AutomatedProbe',
    sector: 'Deep Void [Sector 0x8F]',
    frequency: '32.10 MHz',
    distanceKm: '1,420,000 km',
    signalStrength: 2,
    type: 'beacon',
    role: 'probe',
    text: '[BEACON PULSE] Weak carrier wave received from edge of mapped network. Quantum syntax anomalies converging on Sector 4.',
    avatarColor: 'from-purple-500 to-indigo-600',
    isCombatAlert: true,
  },
  {
    sender: 'Europa Outpost Alpha',
    callsign: 'FrostVector',
    sector: 'Sector 19 [Europa Relays]',
    frequency: '440.12 MHz',
    distanceKm: '628,000 km',
    signalStrength: 3,
    type: 'telemetry',
    role: 'debugger',
    text: 'Sub-zero quantum servers pinging your terminal. Receiving clean handshake; speed bonus multiplier online.',
    avatarColor: 'from-sky-400 to-cyan-500',
  },
  {
    sender: 'Kyoto Deep Station',
    callsign: 'RoninRelay',
    sector: 'Sector 07 [Kyoto Quadrant]',
    frequency: '92.40 GHz',
    distanceKm: '12,400 km',
    signalStrength: 5,
    type: 'intercept',
    role: 'striker',
    text: 'Long-range scanner picked up a rogue loop overload in the outer perimeter. Maintain test suite pressure!',
    avatarColor: 'from-emerald-400 to-teal-500',
    isCombatAlert: true,
  },
  {
    sender: 'Helios Solar Array',
    callsign: 'SolarisCore',
    sector: 'Sector 01 [Helios Orbit]',
    frequency: '8.80 GHz',
    distanceKm: '149,000,000 km',
    signalStrength: 2,
    type: 'telemetry',
    role: 'satellite',
    text: 'Solar flare interference dissipated. High-gain microwave link locked onto your battle station.',
    avatarColor: 'from-amber-400 to-red-500',
  },
  {
    sender: 'Lagos Matrix Relay',
    callsign: 'SolarPulse',
    sector: 'Sector 12 [Lagos Hub]',
    frequency: '2.40 THz',
    distanceKm: '8,200 km',
    signalStrength: 5,
    type: 'broadcast',
    role: 'tactician',
    text: 'Dish aligned at Azimuth 142.8°. Uplink established with your local compiler. Stand by for neural package.',
    avatarColor: 'from-amber-400 to-orange-500',
  },
  {
    sender: 'Nebula Deep Outpost',
    callsign: 'StarStriker',
    sector: 'Sector 04 [Nebula Gateway]',
    frequency: '1.42 GHz',
    distanceKm: '48,000 km',
    signalStrength: 4,
    type: 'intercept',
    role: 'striker',
    text: 'Terminaltor logic core pulse detected in nebula dust! 3-letter chains triggering shield breaches.',
    avatarColor: 'from-teal-400 to-emerald-600',
    isCombatAlert: true,
  },
  {
    sender: 'Neo-Accra Uplink',
    callsign: 'MatrixPioneer',
    sector: 'Sector 03 [Neo-Accra]',
    frequency: '12.80 GHz',
    distanceKm: '6,400 km',
    signalStrength: 4,
    type: 'telemetry',
    role: 'tactician',
    text: 'Allied academy signals incoming from southern cyber grid. Inter-academy comms channel clear.',
    avatarColor: 'from-yellow-400 to-emerald-500',
  },
  {
    sender: 'Perimeter Sentinel Beacon',
    callsign: 'Watchtower-4',
    sector: 'Sector 88 [Void Perimeter]',
    frequency: '144.20 MHz',
    distanceKm: '880,000 km',
    signalStrength: 2,
    type: 'distress',
    role: 'probe',
    text: '[DISTANT DISTRESS BEACON] Automated distress pulse received. Logic leak detected in remote sector node.',
    avatarColor: 'from-rose-500 to-red-700',
    isCombatAlert: true,
  },
  {
    sender: 'Ose Orbital Constellation',
    callsign: 'GroundSatellite',
    sector: 'LEO Orbit // Sector 00',
    frequency: '5.50 GHz',
    distanceKm: '420 km',
    signalStrength: 5,
    type: 'telemetry',
    role: 'satellite',
    text: 'Satellite sweep complete. Intercepted 14 distant beacon carrier waves across outer coordinate planes.',
    avatarColor: 'from-cyan-400 to-blue-500',
  },
  {
    sender: 'Andromeda Deep Array',
    callsign: 'PulsarBeacon',
    sector: 'Deep Void [Sector 0x8F]',
    frequency: '1420.405 MHz',
    distanceKm: '2,500,000 km',
    signalStrength: 1,
    type: 'beacon',
    role: 'probe',
    text: '[HYDROGEN LINE INTERCEPT] Harmonic pulse synchronized with your WordForge arena. High-value letters primed.',
    avatarColor: 'from-fuchsia-400 to-indigo-600',
  },
];

interface SquadChatterProps {
  currentUsername?: string;
  roomCode?: string;
  inRoom?: boolean;
  selectedMode?: 'wordforge' | 'debugshunting';
}

// Play a subtle, soft sci-fi radar chirping sound via Web Audio API
const playBeaconAudioChirp = (frequency = 880) => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.015, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Audio context may be muted or blocked by browser policy
  }
};

export const SquadChatter: React.FC<SquadChatterProps> = ({
  currentUsername = 'Cadet',
  roomCode = 'ARENA-FORGE-1',
  inRoom = false,
  selectedMode = 'wordforge',
}) => {
  const [messages, setMessages] = useState<SectorBeaconMessage[]>(INITIAL_BEACON_SIGNALS);
  const [inputText, setInputText] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [bossShield, setBossShield] = useState(78);
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('ALL');
  const [isScanning, setIsScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [azimuthAngle, setAzimuthAngle] = useState(142.4);
  const [satelliteTracking, setSatelliteTracking] = useState('LOCK ACQUIRED');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (scrollRef.current && !isCollapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isCollapsed]);

  // Periodic satellite sweep picking up distant signals from other sectors (every 12 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const randomBeacon = DISTANT_BEACONS[Math.floor(Math.random() * DISTANT_BEACONS.length)];
      const newMsg: SectorBeaconMessage = {
        id: `bcn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender: randomBeacon.sender,
        callsign: randomBeacon.callsign,
        sector: randomBeacon.sector,
        frequency: randomBeacon.frequency,
        distanceKm: randomBeacon.distanceKm,
        signalStrength: randomBeacon.signalStrength,
        type: randomBeacon.type,
        role: randomBeacon.role,
        text: randomBeacon.text,
        timestamp: 'Just now',
        isCombatAlert: randomBeacon.isCombatAlert,
        avatarColor: randomBeacon.avatarColor,
      };

      setMessages((prev) => {
        const next = [...prev, newMsg];
        return next.length > 35 ? next.slice(next.length - 35) : next;
      });

      // Update dish tracking telemetry
      setAzimuthAngle((prev) => parseFloat(((prev + (Math.random() * 4 - 2) + 360) % 360).toFixed(1)));

      if (soundEnabled) {
        playBeaconAudioChirp(newMsg.isCombatAlert ? 1040 : 780);
      }

      // Fluctuate boss shield / perimeter threat
      setBossShield((prev) => Math.max(12, Math.min(99, prev + (Math.random() > 0.6 ? -2 : 1))));
    }, 12000);

    return () => clearInterval(interval);
  }, [soundEnabled]);

  // Trigger manual sector frequency sweep
  const triggerSectorSweep = () => {
    if (isScanning) return;
    setIsScanning(true);
    setSatelliteTracking('SWEEPING FREQUENCIES...');

    if (soundEnabled) {
      playBeaconAudioChirp(520);
    }

    setTimeout(() => {
      const unpicked = DISTANT_BEACONS[Math.floor(Math.random() * DISTANT_BEACONS.length)];
      const intercepted: SectorBeaconMessage = {
        id: `sweep_${Date.now()}`,
        sender: unpicked.sender,
        callsign: unpicked.callsign,
        sector: unpicked.sector,
        frequency: unpicked.frequency,
        distanceKm: unpicked.distanceKm,
        signalStrength: Math.floor(Math.random() * 2) + 4,
        type: 'intercept',
        role: unpicked.role,
        text: `[FRESH SATELLITE INTERCEPT] ${unpicked.text}`,
        timestamp: 'Just now',
        isCombatAlert: unpicked.isCombatAlert,
        avatarColor: unpicked.avatarColor,
      };

      setMessages((prev) => [...prev, intercepted]);
      setIsScanning(false);
      setSatelliteTracking('LOCK ACQUIRED');
      setAzimuthAngle((prev) => parseFloat(((prev + 18.5) % 360).toFixed(1)));

      if (soundEnabled) {
        playBeaconAudioChirp(1200);
      }
    }, 900);
  };

  const handleSendTransmission = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    const userTransmission: SectorBeaconMessage = {
      id: `usr_${Date.now()}`,
      sender: currentUsername,
      callsign: 'TerminalStation',
      sector: 'LOCAL HUB // Station Zero',
      frequency: '1420.405 MHz (Uplink)',
      distanceKm: '0 km (Origin)',
      signalStrength: 5,
      type: 'uplink',
      role: 'player',
      text,
      timestamp: 'Just now',
      avatarColor: 'from-emerald-500 to-teal-400',
    };

    setMessages((prev) => [...prev, userTransmission]);
    setInputText('');

    if (soundEnabled) {
      playBeaconAudioChirp(680);
    }

    // Satellite Array automated cross-sector acknowledgment
    setTimeout(() => {
      const isBossCmd = text.startsWith('!') || text.toLowerCase().includes('boss') || text.toLowerCase().includes('beacon') || text.toLowerCase().includes('sector');
      const relayReply: SectorBeaconMessage = {
        id: `ack_${Date.now()}`,
        sender: 'Orbital Array Alpha',
        callsign: 'SatelliteRelay',
        sector: 'LEO Orbit // Sector 00',
        frequency: '5.50 GHz (Downlink)',
        distanceKm: '420 km',
        signalStrength: 5,
        type: 'telemetry',
        role: 'satellite',
        text: isBossCmd
          ? `[UPLINK BROADCAST CONFIRMED] Transmission beamed to Sector 07 and Europa Outpost. Perimeter defense vectors synchronized!`
          : `[SIGNAL RELAYED] Outbound packet routed through satellite array. 6 active sector stations acknowledged your beacon.`,
        timestamp: 'Just now',
        avatarColor: 'from-cyan-400 to-blue-500',
      };
      setMessages((prev) => [...prev, relayReply]);
    }, 800);
  };

  // Filter messages by sector if user selects a specific quadrant
  const filteredMessages = messages.filter((msg) => {
    if (selectedSectorFilter === 'ALL') return true;
    if (selectedSectorFilter === 'SECTOR_07') return msg.sector.includes('07');
    if (selectedSectorFilter === 'SECTOR_12') return msg.sector.includes('12');
    if (selectedSectorFilter === 'SECTOR_04') return msg.sector.includes('04');
    if (selectedSectorFilter === 'DEEP_VOID') return msg.sector.includes('Deep Void') || msg.sector.includes('0x8F') || msg.sector.includes('88');
    if (selectedSectorFilter === 'EUROPA') return msg.sector.includes('19') || msg.sector.includes('Europa');
    return true;
  });

  return (
    <div className="bg-slate-950/95 border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl text-slate-200 font-sans relative backdrop-blur-md">
      {/* CRT Scanline & Cosmic Radar Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.03] to-transparent opacity-70 bg-[length:100%_4px]" />

      {/* Satellite Dish & Telemetry Header */}
      <div className="px-4 py-3 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 relative z-10">
        {/* Left: Satellite array status and title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-inner">
            <Satellite className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Radar className="w-3.5 h-3.5 text-cyan-400 inline" />
                Orbital Beacon Array
              </span>
              <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Globe className="w-2.5 h-2.5" />
                SECTOR SATELLITE INTERCEPT
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
              <span className="text-cyan-400/90 font-semibold">{satelliteTracking}</span>
              <span>•</span>
              <span>AZ: {azimuthAngle}°</span>
              <span>•</span>
              <span className="text-slate-500">DISTANT BEACONS: ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Right: Threat monitor, sector sweep, collapse */}
        <div className="flex items-center gap-2.5">
          {/* Perimeter Threat / Boss Shield Bar */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <Skull className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-slate-400 text-[10px] uppercase font-bold">Terminaltor Loop:</span>
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                style={{ width: `${bossShield}%` }}
              />
            </div>
            <span className="text-rose-400 font-bold text-[10px]">{bossShield}%</span>
          </div>

          {/* Sweep Button */}
          <button
            type="button"
            onClick={triggerSectorSweep}
            disabled={isScanning}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 active:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Sweep frequencies across all distant sectors"
          >
            <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Scan Sectors'}</span>
          </button>

          {/* Audio toggle */}
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playBeaconAudioChirp(880);
            }}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={soundEnabled ? 'Mute Beacon Audio' : 'Enable Beacon Audio Chirps'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Collapse / Expand */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Beacon Terminal' : 'Collapse Beacon Terminal'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Sector Tuning Bar / Filter Quadrants */}
          <div className="px-4 py-1.5 bg-slate-900/70 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono scrollbar-none">
            <span className="text-slate-500 shrink-0 uppercase font-bold flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400" />
              Tune Sector:
            </span>
            {[
              { id: 'ALL', label: 'All Beacons' },
              { id: 'SECTOR_07', label: 'Sector 07 (Kyoto)' },
              { id: 'SECTOR_12', label: 'Sector 12 (Lagos)' },
              { id: 'SECTOR_04', label: 'Sector 04 (Nebula)' },
              { id: 'EUROPA', label: 'Sector 19 (Europa)' },
              { id: 'DEEP_VOID', label: 'Deep Void (0x8F)' },
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSelectedSectorFilter(sec.id)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono shrink-0 transition-all cursor-pointer ${
                  selectedSectorFilter === sec.id
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>

          {/* Intercepted Beacon Signals Feed */}
          <div
            ref={scrollRef}
            className="p-3.5 sm:p-4 space-y-3 max-h-64 sm:max-h-72 overflow-y-auto text-xs font-mono divide-y divide-slate-800/40 relative"
          >
            {filteredMessages.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs font-mono">
                No beacon signals intercepted on this frequency. Click "Scan Sectors" to sweep outer space.
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`pt-2.5 first:pt-0 flex items-start gap-2.5 transition-colors ${
                    msg.isCombatAlert
                      ? 'bg-rose-950/20 -mx-2 px-2.5 py-2 rounded-xl border-l-2 border-rose-500'
                      : msg.type === 'uplink'
                      ? 'bg-emerald-950/25 -mx-2 px-2.5 py-2 rounded-xl border-l-2 border-emerald-400'
                      : ''
                  }`}
                >
                  {/* Origin Sector & Avatar */}
                  <div
                    className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${msg.avatarColor} text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0 shadow-md uppercase`}
                  >
                    {msg.role === 'satellite' ? (
                      <Satellite className="w-3.5 h-3.5 text-slate-950" />
                    ) : msg.role === 'probe' ? (
                      <Radio className="w-3.5 h-3.5 text-slate-950" />
                    ) : msg.type === 'uplink' ? (
                      <Send className="w-3.5 h-3.5 text-slate-950" />
                    ) : (
                      msg.sender.charAt(0)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header info for message */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="font-bold text-white text-[11px]">{msg.sender}</span>
                      
                      {/* Sector badge */}
                      <span className="text-[9px] uppercase tracking-wider text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60 font-semibold flex items-center gap-1">
                        <Signal className="w-2.5 h-2.5 text-cyan-400" />
                        {msg.sector}
                      </span>

                      {/* Distance or frequency */}
                      <span className="text-[9px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800/80 hidden sm:inline">
                        {msg.distanceKm} • {msg.frequency}
                      </span>

                      {/* Beacon type indicator */}
                      {msg.type === 'beacon' && (
                        <span className="text-[9px] font-bold text-purple-300 bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.2 rounded uppercase">
                          BEACON
                        </span>
                      )}
                      {msg.type === 'intercept' && (
                        <span className="text-[9px] font-bold text-teal-300 bg-teal-500/10 border border-teal-500/30 px-1.5 py-0.2 rounded uppercase">
                          INTERCEPT
                        </span>
                      )}
                      {msg.type === 'uplink' && (
                        <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded uppercase">
                          OUTGOING UPLINK
                        </span>
                      )}
                      {msg.isCombatAlert && (
                        <span className="text-[9px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 px-1.5 py-0.2 rounded uppercase animate-pulse">
                          ANOMALY
                        </span>
                      )}

                      <span className="text-[9px] text-slate-500 ml-auto">{msg.timestamp}</span>
                    </div>

                    {/* Message content */}
                    <p
                      className={`leading-relaxed text-[11px] break-words ${
                        msg.role === 'player'
                          ? 'text-emerald-200 font-semibold'
                          : msg.isCombatAlert
                          ? 'text-rose-200'
                          : msg.type === 'beacon'
                          ? 'text-purple-200'
                          : 'text-slate-300'
                      }`}
                    >
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick uplink chips */}
          <div className="px-4 py-1.5 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono scrollbar-none">
            <span className="text-slate-500 shrink-0 uppercase font-bold">Uplink:</span>
            <button
              type="button"
              onClick={() => setInputText('!scan deep sectors')}
              className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 transition-colors cursor-pointer"
            >
              !scan deep sectors
            </button>
            <button
              type="button"
              onClick={() => setInputText('!ping Europa beacon')}
              className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 transition-colors cursor-pointer"
            >
              !ping Europa beacon
            </button>
            <button
              type="button"
              onClick={() => setInputText('!calibrate dish')}
              className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 transition-colors cursor-pointer"
            >
              !calibrate dish
            </button>
            <button
              type="button"
              onClick={() => setInputText('!broadcast coordinates')}
              className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 transition-colors cursor-pointer"
            >
              !broadcast coordinates
            </button>
          </div>

          {/* Outbound high-gain transmission uplink form */}
          <form onSubmit={handleSendTransmission} className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Broadcast transmission across outer sectors (!)..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-3 pr-8 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
              />
              <Radio className="w-3.5 h-3.5 text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 shadow-md"
              title="Broadcast transmission via satellite dish"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono uppercase font-black hidden sm:inline">Beam</span>
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default SquadChatter;
