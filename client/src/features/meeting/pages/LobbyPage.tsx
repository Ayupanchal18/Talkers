import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Copy,
  Check,
  AlertTriangle,
  Camera,
  Headphones,
  ArrowRight,
} from 'lucide-react';

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        setDevices(list);
      } catch (err) {
        console.error('[Lobby] Failed to enumerate devices:', err);
      }
    };
    getDevices();
  }, []);

  useEffect(() => {
    let active = true;

    const startPreview = async () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setPermissionError(null);

      if (!videoEnabled && !micEnabled) {
        setLocalStream(null);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoEnabled ? {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          } : false,
          audio: micEnabled ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } : false,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        setLocalStream(stream);
        streamRef.current = stream;
      } catch (err) {
        if (!active) return;
        console.error('[Lobby] Media access error:', err);
        setPermissionError(
          err instanceof Error
            ? err.message
            : 'Could not access camera or microphone. Please check permissions.',
        );
      }
    };

    startPreview();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoEnabled, micEnabled]);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
      videoRef.current.play().catch((err) => {
        console.warn('[Lobby] Programmatic play failed:', err);
      });
    }
  }, [localStream, videoEnabled]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && videoRef.current && localStream && videoEnabled && !permissionError) {
        videoRef.current.play().catch((err) => {
          console.warn('[Lobby] Failed to resume preview on visibility change:', err);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [localStream, videoEnabled, permissionError]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${code}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleJoinCall = () => {
    navigate(`/room/${code}`, {
      state: { initialMic: micEnabled, initialVideo: videoEnabled },
    });
  };

  const camerasCount = devices.filter((d) => d.kind === 'videoinput').length;
  const micsCount = devices.filter((d) => d.kind === 'audioinput').length;

  return (
    <div className="lobby-root flex-grow flex items-center justify-center p-6">
      <div className="w-full max-w-4xl grid md:grid-cols-5 gap-8 items-center">

        {/* Left — Camera Preview */}
        <div className="md:col-span-3 space-y-4">
          {/* Preview Box */}
          <div className="lobby-preview-box relative aspect-video w-full rounded-2xl bg-[#0c1220] border border-[#1e293b] overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                videoEnabled && localStream && !permissionError ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />

            {permissionError ? (
              <div className="text-center space-y-3 p-8">
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-amber-400" />
                </div>
                <p className="text-sm font-semibold text-amber-300">Camera access blocked</p>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">{permissionError}</p>
              </div>
            ) : (!videoEnabled || !localStream) ? (
              <div className="text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-slate-800/60 border border-[#1e293b] flex items-center justify-center">
                  <VideoOff className="w-7 h-7 text-slate-600" />
                </div>
                <p className="text-sm text-slate-500 font-medium">Camera is off</p>
              </div>
            ) : null}

            {/* Mic badge */}
            <div className="absolute bottom-3 left-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md border ${
                  micEnabled && !permissionError
                    ? 'bg-[#0c1220]/70 border-[#1e293b]/60 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              >
                {micEnabled && !permissionError ? (
                  <Mic className="w-3 h-3" />
                ) : (
                  <MicOff className="w-3 h-3" />
                )}
                {micEnabled && !permissionError ? 'Mic on' : 'Muted'}
              </span>
            </div>

            {/* Subtle corner gradient */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0c1220]/50 via-transparent to-transparent" />
          </div>

          {/* Circular Toggle Controls */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => setMicEnabled(!micEnabled)}
                title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
                className={`lobby-toggle-btn p-4 rounded-full transition-all duration-200 cursor-pointer ${
                  micEnabled
                    ? 'bg-[#1e293b] hover:bg-[#2d3b4e] text-slate-200 border border-[#334155]/50'
                    : 'bg-red-600 hover:bg-red-700 text-white border border-transparent shadow-lg shadow-red-900/30'
                }`}
              >
                {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                {micEnabled ? 'Mute' : 'Unmute'}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => setVideoEnabled(!videoEnabled)}
                title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                className={`lobby-toggle-btn p-4 rounded-full transition-all duration-200 cursor-pointer ${
                  videoEnabled
                    ? 'bg-[#1e293b] hover:bg-[#2d3b4e] text-slate-200 border border-[#334155]/50'
                    : 'bg-red-600 hover:bg-red-700 text-white border border-transparent shadow-lg shadow-red-900/30'
                }`}
              >
                {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                {videoEnabled ? 'Stop' : 'Start'}
              </span>
            </div>
          </div>
        </div>

        {/* Right — Join Panel */}
        <div className="lobby-join-card md:col-span-2 rounded-2xl p-6 space-y-5">
          {/* Header */}
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">Ready to join?</h2>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Room code:</span>
              <span className="text-xs font-mono text-blue-400 font-semibold select-all">{code}</span>
            </div>
          </div>

          {/* Device Info */}
          <div className="lobby-device-info rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Detected Devices</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  Cameras
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${camerasCount > 0 ? 'bg-green-500/10 text-green-400' : 'bg-slate-700/50 text-slate-500'}`}>
                  {camerasCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center">
                    <Headphones className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  Microphones
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${micsCount > 0 ? 'bg-green-500/10 text-green-400' : 'bg-slate-700/50 text-slate-500'}`}>
                  {micsCount}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5">
            <button
              onClick={handleCopyLink}
              className="lobby-copy-btn w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy invite link
                </>
              )}
            </button>

            <button
              onClick={handleJoinCall}
              className="lobby-join-btn w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer"
            >
              Join now
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
