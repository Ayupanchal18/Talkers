import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  MessageSquare,
  Users,
  PhoneOff,
  Send,
  X,
  PictureInPicture,
  Pin,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useMeetingSocket } from '../hooks/useMeetingSocket';
import { MEETING_CONFIG } from '@/shared/constants';

interface Participant {
  socketId: string;
  userId: string;
  name: string;
  micEnabled: boolean;
  videoEnabled: boolean;
  stream?: MediaStream;
}

interface RemoteVideoProps {
  stream?: MediaStream;
  visible: boolean;
  isPinned: boolean;
  onPin: () => void;
}

function RemoteVideo({ stream, visible, isPinned, onPin }: RemoteVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
      ref.current.play().catch((err) => {
        console.warn('[RemoteVideo] Programmatic play failed:', err);
      });
    }
  }, [stream]);

  const isPiPSupported = typeof document !== 'undefined' && document.pictureInPictureEnabled;

  const handleTogglePiP = async () => {
    if (!ref.current) return;
    try {
      if (document.pictureInPictureElement === ref.current) {
        await document.exitPictureInPicture();
      } else {
        await ref.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('[PiP] Error toggling Picture-in-Picture:', err);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full">
      <video
        ref={ref}
        autoPlay
        playsInline
        className={`room-video-frame absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      {visible && stream && (
        <button
          onClick={onPin}
          className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-[#0c1220]/75 hover:bg-[#0c1220] text-slate-300 hover:text-white border border-[#1e293b]/50 px-2 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase shadow-md transition-colors"
          title={isPinned ? 'Unpin participant' : 'Pin participant'}
        >
          <Pin size={12} className={isPinned ? 'rotate-45 text-blue-400' : ''} />
          <span>{isPinned ? 'Unpin' : 'Pin'}</span>
        </button>
      )}
      {visible && stream && isPiPSupported && (
        <button
          onClick={handleTogglePiP}
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-[#0c1220]/75 hover:bg-[#0c1220] text-slate-300 hover:text-white border border-[#1e293b]/50 px-2 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase shadow-md transition-colors"
          title="Picture in Picture"
        >
          <PictureInPicture size={12} />
          <span>Floating View</span>
        </button>
      )}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 h-full">
      <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300 text-xl font-semibold">
        {name.charAt(0).toUpperCase()}
      </div>
      <p className="text-sm text-slate-400 font-medium">{name}</p>
    </div>
  );
}

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const initialStates = location.state as { initialMic?: boolean; initialVideo?: boolean } | null;

  const [micEnabled, setMicEnabled] = useState(initialStates?.initialMic !== false);
  const [videoEnabled, setVideoEnabled] = useState(initialStates?.initialVideo !== false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'participants'>('chat');

  const [messages, setMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: 'System',
      text: 'Welcome to the meeting! Share the code to invite others.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [pinnedSocketId, setPinnedSocketId] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidateQueue = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  const createPeerConnection = (remoteSocketId: string) => {
    if (pcsRef.current.has(remoteSocketId)) {
      return pcsRef.current.get(remoteSocketId)!;
    }

    const pc = new RTCPeerConnection({
      iceServers: [...MEETING_CONFIG.ICE_SERVERS],
    });

    pcsRef.current.set(remoteSocketId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendIceCandidate(remoteSocketId, event.candidate);
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        setParticipants((prev) =>
          prev.map((p) => (p.socketId === remoteSocketId ? { ...p, stream: remoteStream } : p)),
        );
      }
    };

    const activeStream = screenSharing ? screenStreamRef.current : localStreamRef.current;
    if (activeStream) {
      activeStream.getTracks().forEach((track) => {
        pc.addTrack(track, activeStream);
      });
    }

    return pc;
  };

  const { socket, sendMessage, toggleAudio, toggleVideo, sendOffer, sendAnswer, sendIceCandidate } =
    useMeetingSocket({
      roomCode: code || '',
      isMediaReady: !!localStream,
      onMessageReceived: (msg) => {
        setMessages((prev) => [...prev, msg]);
      },
      onParticipantsList: (list) => {
        setParticipants(list.map((p) => ({ ...p, micEnabled: true, videoEnabled: true })));
      },
      onUserJoined: async (newMember) => {
        // Atomically remove any stale card for this userId and add the fresh one
        setParticipants((prev) => {
          const stale = prev.find((p) => p.userId === newMember.userId);
          if (stale) {
            const pc = pcsRef.current.get(stale.socketId);
            if (pc) {
              pc.onicecandidate = null;
              pc.ontrack = null;
              pc.close();
              pcsRef.current.delete(stale.socketId);
            }
          }
          const filtered = prev.filter((p) => p.userId !== newMember.userId);
          return [
            ...filtered,
            {
              socketId: newMember.socketId,
              userId: newMember.userId,
              name: newMember.name,
              micEnabled: true,
              videoEnabled: true,
            },
          ];
        });
        setMessages((prev) => [
          ...prev,
          {
            sender: 'System',
            text: `${newMember.name} joined.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        try {
          const pc = createPeerConnection(newMember.socketId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendOffer(newMember.socketId, offer);
        } catch (err) {
          console.error('[WebRTC] Offer error:', err);
        }
      },
      onUserLeft: (leftMember) => {
        const pc = pcsRef.current.get(leftMember.socketId);
        if (pc) {
          pc.onicecandidate = null;
          pc.ontrack = null;
          pc.close();
          pcsRef.current.delete(leftMember.socketId);
        }
        setParticipants((prev) => {
          const found = prev.find((p) => p.socketId === leftMember.socketId);
          if (found) {
            setMessages((m) => [
              ...m,
              {
                sender: 'System',
                text: `${found.name} left.`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
          return prev.filter((p) => p.socketId !== leftMember.socketId);
        });
      },
      onSignalOffer: async ({ from, offer }) => {
        try {
          const pc = createPeerConnection(from);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          // Flush any ICE candidates that arrived before the remote description
          const queued = iceCandidateQueue.current.get(from) || [];
          for (const c of queued) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          iceCandidateQueue.current.delete(from);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendAnswer(from, answer);
        } catch (err) {
          console.error('[WebRTC] Offer processing error:', err);
        }
      },
      onSignalAnswer: async ({ from, answer }) => {
        try {
          const pc = pcsRef.current.get(from);
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            // Flush any ICE candidates that arrived before the remote description
            const queued = iceCandidateQueue.current.get(from) || [];
            for (const c of queued) {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            }
            iceCandidateQueue.current.delete(from);
          }
        } catch (err) {
          console.error('[WebRTC] Answer error:', err);
        }
      },
      onSignalIce: async ({ from, candidate }) => {
        try {
          const pc = pcsRef.current.get(from);
          if (!pc) return;
          if (pc.remoteDescription) {
            // Remote description is set — add immediately
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            // Queue candidate until remote description is ready
            const q = iceCandidateQueue.current.get(from) || [];
            q.push(candidate);
            iceCandidateQueue.current.set(from, q);
          }
        } catch (err) {
          console.error('[WebRTC] ICE error:', err);
        }
      },
      onAudioToggled: ({ socketId, enabled }) => {
        setParticipants((prev) =>
          prev.map((p) => (p.socketId === socketId ? { ...p, micEnabled: enabled } : p)),
        );
      },
      onVideoToggled: ({ socketId, enabled }) => {
        setParticipants((prev) =>
          prev.map((p) => (p.socketId === socketId ? { ...p, videoEnabled: enabled } : p)),
        );
      },
      onError: (err) => console.error('[Socket Error]', err.message),
    });

  // Local media stream
  useEffect(() => {
    let active = true;
    const currentPcs = pcsRef.current;
    const currentLocalStreamRef = localStreamRef;
    const currentScreenStreamRef = screenStreamRef;

    const initLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: initialStates?.initialVideo !== false ? {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          } : false,
          audio: initialStates?.initialMic !== false ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } : false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setLocalStream(stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch((err) => {
            console.warn('[Room] Direct local video play failed:', err);
          });
        }
        stream.getVideoTracks().forEach((t) => (t.enabled = videoEnabled));
        stream.getAudioTracks().forEach((t) => (t.enabled = micEnabled));
      } catch (err) {
        console.error('[Room] Failed to access media:', err);
      }
    };

    initLocalMedia();

    return () => {
      active = false;
      currentPcs.forEach((pc) => {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.close();
      });
      currentPcs.clear();
      const s = currentLocalStreamRef.current;
      if (s) s.getTracks().forEach((t) => t.stop());
      const sc = currentScreenStreamRef.current;
      if (sc) sc.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set the local video element's srcObject when the video element mounts or the stream is initialized
  useEffect(() => {
    if (localVideoRef.current) {
      const activeStream = screenSharing ? screenStreamRef.current : localStream;
      if (activeStream) {
        localVideoRef.current.srcObject = activeStream;
        localVideoRef.current.play().catch((err) => {
          console.warn('[Room] Local video play failed:', err);
        });
      }
    }
  }, [localStream, videoEnabled, screenSharing]);

  // Visibility change handler for resuming frozen videos on iOS Safari
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const videos = document.querySelectorAll('video');
        videos.forEach((video) => {
          video.play().catch((err) => {
            console.warn('[Room] Failed to resume video playback on visibility change:', err);
          });
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleToggleMic = () => {
    const nextState = !micEnabled;
    setMicEnabled(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = nextState));
    }
    toggleAudio(nextState);
  };

  const handleToggleVideo = () => {
    const nextState = !videoEnabled;
    setVideoEnabled(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = nextState));
    }
    toggleVideo(nextState);
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setScreenSharing(false);
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
    pcsRef.current.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender && cameraTrack) sender.replaceTrack(cameraTrack);
    });
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch((err) => {
        console.warn('[Room] Screen share restore play failed:', err);
      });
    }
  };

  const handleToggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        setScreenSharing(true);
        const screenTrack = screenStream.getVideoTracks()[0];
        pcsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender && screenTrack) sender.replaceTrack(screenTrack);
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
          localVideoRef.current.play().catch((err) => {
            console.warn('[Room] Screen share start play failed:', err);
          });
        }
        screenTrack.onended = () => stopScreenShare();
      } catch (err) {
        console.error('[Room] Screen share error:', err);
      }
    } else {
      stopScreenShare();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;
      const key = e.key.toLowerCase();
      if (key === 'm') handleToggleMic();
      else if (key === 'v') handleToggleVideo();
      else if (key === 'c') {
        setSidebarOpen((p) => !p || sidebarTab !== 'chat');
        setSidebarTab('chat');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micEnabled, videoEnabled, sidebarOpen, sidebarTab]);

  const handleHangUp = () => {
    // 1. Explicitly disconnect socket from the signaling room
    if (socket) {
      socket.emit('room:leave');
      socket.disconnect();
    }
    // 2. Shut down camera and audio tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    // 3. Clear screen share tracks
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    // 4. Terminate and clear all RTCPeerConnections
    pcsRef.current.forEach((pc) => {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.close();
    });
    pcsRef.current.clear();
    // 5. Finally transition back to main route
    navigate('/');
  };

  const renderVideoCard = (id: 'local' | string, isThumbnail: boolean = false) => {
    if (id === 'local') {
      return (
        <div
          key="local"
          className={`room-video-card relative rounded-2xl bg-[#0c1220] border overflow-hidden flex items-center justify-center transition-all duration-300 ${
            isThumbnail ? 'w-full h-[160px] min-h-[160px]' : 'w-full h-full min-h-[220px]'
          } ${
            micEnabled ? 'room-video-card-speaking border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-[#1e293b]'
          }`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`room-video-frame absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
              videoEnabled && localStream ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
          {(!videoEnabled || !localStream) && (
            <div className="room-avatar-container">
              <Avatar name={user?.name || 'You'} />
            </div>
          )}
          {/* Speaking badge */}
          {micEnabled && (
            <div className="room-speaking-badge absolute top-3 right-3 flex items-center gap-1.5 bg-[#3b82f6]/10 border border-[#3b82f6]/30 px-2.5 py-1 rounded-md text-[10px] text-blue-400 font-semibold tracking-wide uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              Speaking
            </div>
          )}
          {/* Pin Button */}
          {localStream && (
            <button
              onClick={() => setPinnedSocketId(pinnedSocketId === 'local' ? null : 'local')}
              className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-[#0c1220]/75 hover:bg-[#0c1220] text-slate-300 hover:text-white border border-[#1e293b]/50 px-2 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase shadow-md transition-colors"
              title={pinnedSocketId === 'local' ? 'Unpin video' : 'Pin video'}
            >
              <Pin size={12} className={pinnedSocketId === 'local' ? 'rotate-45 text-blue-400' : ''} />
              <span>{pinnedSocketId === 'local' ? 'Unpin' : 'Pin'}</span>
            </button>
          )}
          {/* Name badge */}
          <div className="room-info-bar absolute bottom-3 left-3 flex items-center gap-2 bg-[#0c1220]/75 backdrop-filter backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#1e293b]/50">
            <span className="text-[11px] text-slate-300 font-semibold">
              {user?.name} (You)
            </span>
            {!micEnabled && <MicOff className="w-3.5 h-3.5 text-red-500" />}
          </div>
        </div>
      );
    } else {
      const p = participants.find((part) => part.socketId === id);
      if (!p) return null;
      const isPinned = pinnedSocketId === p.socketId;
      return (
        <div
          key={p.socketId}
          className={`room-video-card relative rounded-2xl bg-[#0c1220] border overflow-hidden flex items-center justify-center transition-all duration-300 ${
            isThumbnail ? 'w-full h-[160px] min-h-[160px]' : 'w-full h-full min-h-[220px]'
          } ${
            p.micEnabled ? 'room-video-card-speaking border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-[#1e293b]'
          }`}
        >
          <RemoteVideo 
            stream={p.stream} 
            visible={p.videoEnabled && !!p.stream}
            isPinned={isPinned}
            onPin={() => setPinnedSocketId(isPinned ? null : p.socketId)}
          />
          {(!p.videoEnabled || !p.stream) && (
            <div className="room-avatar-container">
              <Avatar name={p.name} />
            </div>
          )}
          {p.micEnabled && (
            <div className="room-speaking-badge absolute top-3 right-3 flex items-center gap-1.5 bg-[#3b82f6]/10 border border-[#3b82f6]/30 px-2.5 py-1 rounded-md text-[10px] text-blue-400 font-semibold tracking-wide uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              Speaking
            </div>
          )}
          <div className="room-info-bar absolute bottom-3 left-3 flex items-center gap-2 bg-[#0c1220]/75 backdrop-filter backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#1e293b]/50">
            <span className="text-[11px] text-slate-300 font-semibold">
              {p.name}
            </span>
            {!p.micEnabled && <MicOff className="w-3.5 h-3.5 text-red-500" />}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="room-root h-screen w-screen text-slate-100 flex flex-col overflow-hidden">
      {/* Room Header */}
      <div className="room-header h-[56px] shrink-0 flex items-center justify-between px-5 border-b border-[#1e293b] bg-[#0c1220]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="room-live-dot h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-500 uppercase tracking-wider font-semibold">Live</span>
          </div>
          <span className="text-xs text-slate-700">•</span>
          <span className="text-xs font-mono text-slate-400 select-all cursor-pointer hover:text-blue-400 transition-colors" title="Click to copy">{code}</span>
        </div>
        <span className="text-xs text-slate-400 font-medium bg-[#1e293b]/40 px-2.5 py-1 rounded-md border border-[#334155]/20">
          {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
        </span>
      </div>

      {/* Main Flex Area */}
      <div className="room-main-area flex-grow flex overflow-hidden">
        {/* Video Grid / Focus Area */}
        <div className="flex-grow flex flex-col p-3 gap-3 overflow-hidden room-video-grid-wrapper">
          {pinnedSocketId ? (
            <div className="flex-grow flex flex-col md:flex-row gap-3 h-full overflow-hidden w-full">
              {/* Pinned Video */}
              <div className="flex-[3] h-full relative">
                {renderVideoCard(pinnedSocketId)}
              </div>
              
              {/* Sidebar thumbnails */}
              <div className="flex-[1] h-full flex flex-row md:flex-col gap-3 overflow-auto pr-1 room-thumbnails-sidebar min-w-[200px]">
                {pinnedSocketId !== 'local' && renderVideoCard('local', true)}
                {participants
                  .filter((p) => p.socketId !== pinnedSocketId)
                  .map((p) => renderVideoCard(p.socketId, true))}
              </div>
            </div>
          ) : (
            <div className="room-video-grid flex-grow grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch overflow-auto">
              {renderVideoCard('local')}
              {participants.map((p) => renderVideoCard(p.socketId))}
            </div>
          )}

          {/* Controls Toolbar */}
          <div className="h-20 shrink-0 flex items-center justify-center gap-4 bg-[#0c1220]/80 border border-[#1e293b] rounded-2xl px-6 max-w-xl mx-auto w-full self-center room-controls-toolbar">
            {/* Mic */}
            <button
              onClick={handleToggleMic}
              title={micEnabled ? 'Mute (M)' : 'Unmute (M)'}
              className={`p-3.5 rounded-full transition-all duration-200 cursor-pointer room-btn ${
                micEnabled
                  ? 'bg-[#1e293b] hover:bg-[#2d3b4e] text-slate-200 hover:text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_12px_rgba(220,38,38,0.25)]'
              }`}
            >
              {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>

            {/* Camera */}
            <button
              onClick={handleToggleVideo}
              title={videoEnabled ? 'Stop video (V)' : 'Start video (V)'}
              className={`p-3.5 rounded-full transition-all duration-200 cursor-pointer room-btn ${
                videoEnabled
                  ? 'bg-[#1e293b] hover:bg-[#2d3b4e] text-slate-200 hover:text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_12px_rgba(220,38,38,0.25)]'
              }`}
            >
              {videoEnabled ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>

            {/* Screen Share */}
            <button
              onClick={handleToggleScreenShare}
              title="Share screen"
              className={`p-3.5 rounded-full transition-all duration-200 cursor-pointer room-screen-share-btn room-btn ${
                screenSharing
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-[0_0_12px_rgba(22,163,74,0.25)]'
                  : 'bg-[#1e293b] hover:bg-[#2d3b4e] text-slate-200 hover:text-white'
              }`}
            >
              <Monitor className="w-6 h-6" />
            </button>

            <span className="w-px h-8 bg-[#1e293b] mx-1" />

            {/* Chat */}
            <button
              onClick={() => {
                setSidebarOpen(!sidebarOpen || sidebarTab !== 'chat');
                setSidebarTab('chat');
              }}
              title="Chat (C)"
              className={`p-3.5 rounded-full transition-all duration-200 cursor-pointer room-btn ${
                sidebarOpen && sidebarTab === 'chat'
                  ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]'
                  : 'bg-[#1e293b] hover:bg-[#2d3b4e] text-slate-200 hover:text-white'
              }`}
            >
              <MessageSquare className="w-6 h-6" />
            </button>

            {/* Participants */}
            <button
              onClick={() => {
                setSidebarOpen(!sidebarOpen || sidebarTab !== 'participants');
                setSidebarTab('participants');
              }}
              title="Participants"
              className={`p-3.5 rounded-full transition-all duration-200 cursor-pointer room-btn ${
                sidebarOpen && sidebarTab === 'participants'
                  ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]'
                  : 'bg-[#1e293b] hover:bg-[#2d3b4e] text-slate-200 hover:text-white'
              }`}
            >
              <Users className="w-6 h-6" />
            </button>

            <span className="w-px h-8 bg-[#1e293b] mx-1" />

            {/* Leave */}
            <button
              onClick={handleHangUp}
              title="Leave call"
              className="p-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full transition-all duration-200 cursor-pointer room-btn shadow-[0_0_15px_rgba(220,38,38,0.3)]"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        {sidebarOpen && (
          <div className="room-sidebar w-80 shrink-0 border-l border-[#1e293b] bg-[#0c1220]/95 backdrop-filter backdrop-blur-lg flex flex-col h-full overflow-hidden">
            {/* Tabs Header */}
            <div className="room-sidebar-header flex items-center border-b border-[#1e293b] pr-2 shrink-0 bg-[#080d16]/30">
              <div className="room-sidebar-tabs flex-grow flex p-1.5 gap-1">
                {(['chat', 'participants'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSidebarTab(tab)}
                    className={`room-sidebar-tab-btn flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      sidebarTab === tab
                        ? 'room-sidebar-tab-btn-active bg-[#1e293b] text-blue-400 border-none'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab === 'participants' ? `People (${participants.length + 1})` : 'Chat'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                title="Close sidebar"
                className="room-sidebar-close-btn p-2 hover:bg-[#1e293b]/60 rounded-lg text-slate-500 hover:text-slate-300 transition-colors duration-150 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Content Container */}
            <div className="room-sidebar-content flex-grow flex flex-col overflow-hidden min-h-0">
              {sidebarTab === 'chat' ? (
                <div className="flex flex-col flex-grow overflow-hidden min-h-0">
                  {/* Messages list */}
                  <div className="room-chat-messages flex-grow p-4 overflow-y-auto min-h-0 flex flex-col gap-3">
                    {/* Empty state */}
                    {messages.filter(m => m.sender !== 'System').length === 0 && (
                      <div className="room-chat-empty">
                        <div className="room-chat-empty-icon">
                          <MessageSquare className="w-5 h-5 text-slate-600" />
                        </div>
                        <p>No messages yet.<br />Say hello to start the conversation!</p>
                      </div>
                    )}

                    {messages.map((msg, idx) => {
                      const isMe = msg.sender === user?.name;
                      const isSystem = msg.sender === 'System';
                        if (isSystem) {
                          return (
                            <div key={idx} className="flex justify-center py-1">
                              <span className="text-[10px] text-slate-500 text-center leading-relaxed max-w-[90%]">
                                {msg.text}
                              </span>
                            </div>
                        );
                      }
                      return (
                        <div key={idx} className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-1.5 px-1">
                            <span className="text-[10px] font-bold text-slate-400">{isMe ? 'You' : msg.sender}</span>
                            <span className="text-[9px] text-slate-600">{msg.time}</span>
                          </div>
                          <div className={`room-chat-message-bubble max-w-[85%] text-xs leading-relaxed px-3.5 py-2.5 rounded-2xl shadow-sm ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-[#1e293b] text-slate-200 rounded-tl-none border border-[#334155]/20'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Chat Input */}
                  <form
                    onSubmit={handleSendMessage}
                    className="room-chat-input-form p-3 pt-2.5 border-t border-[#1e2333] flex items-center gap-2.5 shrink-0"
                  >
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type a message…"
                      className="room-chat-input-field flex-grow px-4 py-3 rounded-2xl text-sm text-white placeholder-slate-600 transition-all duration-200 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="room-chat-send-btn shrink-0 p-3 rounded-full text-white cursor-pointer transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ) : (
                // Participants list
                <div className="room-participants-list flex-grow p-3 space-y-1.5 overflow-y-auto min-h-0">
                  {/* Self */}
                  <div className="room-participant-item flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#1e293b]/20 border border-[#334155]/10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md shadow-blue-500/10">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">You · Host</p>
                    </div>
                    <div className="flex gap-2 shrink-0 items-center">
                      {!micEnabled ? <MicOff className="w-3.5 h-3.5 text-red-500" /> : <Mic className="w-3.5 h-3.5 text-slate-500" />}
                      {!videoEnabled ? <VideoOff className="w-3.5 h-3.5 text-red-500" /> : <VideoIcon className="w-3.5 h-3.5 text-slate-500" />}
                    </div>
                  </div>

                  {participants.map((p) => (
                    <div
                      key={p.socketId}
                      className="room-participant-item flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1e293b]/30 border border-transparent hover:border-[#334155]/20 transition-all duration-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-600 to-slate-500 flex items-center justify-center text-slate-200 text-xs font-bold shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{p.name}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Participant</p>
                      </div>
                      <div className="flex gap-2 shrink-0 items-center">
                        {!p.micEnabled ? <MicOff className="w-3.5 h-3.5 text-red-500" /> : <Mic className="w-3.5 h-3.5 text-slate-500" />}
                        {!p.videoEnabled ? <VideoOff className="w-3.5 h-3.5 text-red-500" /> : <VideoIcon className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
