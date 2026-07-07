import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { mediaDevices, RTCView, RTCPeerConnection, RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc';
import * as Lucide from 'lucide-react-native';
import tw from 'twrnc';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useMeetingSocket } from '../hooks/useMeetingSocket';

const Mic = Lucide.Mic as any;
const MicOff = Lucide.MicOff as any;
const VideoIcon = Lucide.Video as any;
const VideoOff = Lucide.VideoOff as any;
const MessageSquare = Lucide.MessageSquare as any;
const Users = Lucide.Users as any;
const PhoneOff = Lucide.PhoneOff as any;
const Send = Lucide.Send as any;
const X = Lucide.X as any;
const Camera = Lucide.Camera as any;
const Maximize2 = Lucide.Maximize2 as any;
const Minimize2 = Lucide.Minimize2 as any;

interface Participant {
  socketId: string;
  userId: string;
  name: string;
  micEnabled: boolean;
  videoEnabled: boolean;
  stream?: any;
}

const { width } = Dimensions.get('window');

export default function RoomPage({ route, navigation }: any) {
  const { code, initialMic, initialVideo } = route.params;
  const { user } = useAuthStore();

  const [micEnabled, setMicEnabled] = useState(initialMic !== false);
  const [videoEnabled, setVideoEnabled] = useState(initialVideo !== false);
  const [localStream, setLocalStream] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: 'System',
      text: 'Welcome to the meeting! Share the code to invite others.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [activeModal, setActiveModal] = useState<'chat' | 'participants' | null>(null);
  const [remoteFit, setRemoteFit] = useState<'cover' | 'contain'>('contain');

  const localStreamRef = useRef<any>(null);
  const pcsRef = useRef<Map<string, any>>(new Map());

  const createPeerConnection = (remoteSocketId: string) => {
    if (pcsRef.current.has(remoteSocketId)) {
      return pcsRef.current.get(remoteSocketId)!;
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    }) as any;

    pcsRef.current.set(remoteSocketId, pc);

    pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        sendIceCandidate(remoteSocketId, event.candidate);
      }
    };

    pc.ontrack = (event: any) => {
      const remoteStream = event.streams[0];
      if (remoteStream) {
        setParticipants((prev) =>
          prev.map((p) => (p.socketId === remoteSocketId ? { ...p, stream: remoteStream } : p)),
        );
      }
    };

    const activeStream = localStreamRef.current;
    if (activeStream) {
      activeStream.getTracks().forEach((track: any) => {
        pc.addTrack(track, activeStream);
      });
    }

    return pc;
  };

  const { sendMessage, toggleAudio, toggleVideo, sendOffer, sendAnswer, sendIceCandidate } =
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
        setParticipants((prev) => [
          ...prev,
          {
            socketId: newMember.socketId,
            userId: newMember.userId,
            name: newMember.name,
            micEnabled: true,
            videoEnabled: true,
          },
        ]);
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
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('[WebRTC] Answer error:', err);
        }
      },
      onSignalIce: async ({ from, candidate }) => {
        try {
          const pc = pcsRef.current.get(from);
          if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
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

  // Local Media Initialization
  useEffect(() => {
    let active = true;
    const currentPcs = pcsRef.current;
    const currentLocalStreamRef = localStreamRef;

    const initLocalMedia = async () => {
      try {
        const stream = await mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
          },
          audio: true,
        });
        if (!active) {
          stream.getTracks().forEach((t: any) => t.stop());
          return;
        }
        setLocalStream(stream);
        localStreamRef.current = stream;
        
        // Sync initial media states to socket and track configurations
        stream.getVideoTracks().forEach((t: any) => (t.enabled = videoEnabled));
        stream.getAudioTracks().forEach((t: any) => (t.enabled = micEnabled));
      } catch (err) {
        console.error('[Room] Failed to access local media:', err);
      }
    };

    initLocalMedia();

    return () => {
      active = false;
      currentPcs.forEach((pc) => pc.close());
      currentPcs.clear();
      const s = currentLocalStreamRef.current;
      if (s) s.getTracks().forEach((t: any) => t.stop());
    };
  }, []);

  const handleToggleMic = () => {
    const nextState = !micEnabled;
    setMicEnabled(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t: any) => (t.enabled = nextState));
    }
    toggleAudio(nextState);
  };

  const handleToggleVideo = () => {
    const nextState = !videoEnabled;
    setVideoEnabled(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t: any) => (t.enabled = nextState));
    }
    toggleVideo(nextState);
  };

  const handleSwitchCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track: any) => {
        // Native camera switcher inside react-native-webrtc
        track._switchCamera();
      });
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleHangUp = () => {
    navigation.navigate('Home');
  };

  // Grid layout calculation
  const totalCards = participants.length + 1;
  const isSingle = totalCards === 1;

  return (
    <SafeAreaView style={tw`flex-1 bg-[#050811] text-slate-100 flex-col`}>
      {/* Header */}
      <View style={tw`h-14 flex-row items-center justify-between px-5 border-b border-[#1e293b] bg-[#0c1220]`}>
        <View style={tw`flex-row items-center gap-2`}>
          <View style={tw`h-2 w-2 rounded-full bg-red-500`} />
          <Text style={tw`text-xs text-red-500 uppercase tracking-wider font-semibold`}>Live</Text>
          <Text style={tw`text-xs text-slate-600`}>•</Text>
          <Text style={tw`text-xs font-mono text-slate-400 font-bold`}>{code}</Text>
        </View>

        <View style={tw`flex-row items-center gap-2.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg`}>
          <Users size={12} color="#94a3b8" />
          <Text style={tw`text-xs text-slate-300 font-semibold`}>
            {participants.length + 1}
          </Text>
        </View>
      </View>

      {/* Videos Grid / 1v1 Layout */}
      {participants.length === 1 ? (
        // 1v1 Layout: Remote user full-screen background, Local user floating
        <View style={tw`flex-grow relative bg-[#050811] justify-center items-center overflow-hidden`}>
          {/* Remote User (Full Screen background) */}
          {(() => {
            const p = participants[0];
            const hasStream = p.videoEnabled && p.stream;
            const isSpeaking = p.micEnabled;

            return (
              <View style={tw`absolute inset-0 w-full h-full justify-center items-center`}>
                {hasStream ? (
                  <RTCView
                    streamURL={p.stream.toURL()}
                    style={tw`w-full h-full`}
                    objectFit={remoteFit}
                  />
                ) : (
                  <View style={tw`items-center gap-3`}>
                    <View style={tw`w-20 h-20 rounded-full bg-blue-600/15 border border-blue-500/20 items-center justify-center`}>
                      <Text style={tw`text-blue-300 text-2xl font-bold`}>
                        {p.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={tw`text-sm text-slate-400 font-semibold`}>{p.name}</Text>
                  </View>
                )}

                {/* Toggle Fit Button Overlay */}
                {hasStream && (
                  <TouchableOpacity
                    onPress={() => setRemoteFit(remoteFit === 'cover' ? 'contain' : 'cover')}
                    style={tw`absolute top-4 left-4 bg-black/60 border border-slate-800 px-3 py-2 rounded-xl flex-row items-center gap-1.5`}
                    activeOpacity={0.7}
                  >
                    {remoteFit === 'cover' ? (
                      <>
                        <Minimize2 size={13} color="white" />
                        <Text style={tw`text-[10px] text-white font-bold uppercase`}>Fit Video</Text>
                      </>
                    ) : (
                      <>
                        <Maximize2 size={13} color="white" />
                        <Text style={tw`text-[10px] text-white font-bold uppercase`}>Fill Screen</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Remote Speaking Badge */}
                {isSpeaking && (
                  <View style={tw`absolute top-4 right-4 bg-blue-500/20 border border-blue-500/30 px-2.5 py-1 rounded-md flex-row items-center gap-1.5`}>
                    <View style={tw`h-1.5 w-1.5 rounded-full bg-blue-400`} />
                    <Text style={tw`text-[9px] text-blue-400 font-bold uppercase`}>Speaking</Text>
                  </View>
                )}

                {/* Remote Name tag */}
                <View style={tw`absolute bottom-4 left-4 bg-[#0c1220]/80 px-3 py-1.5 rounded-lg border border-[#1e293b]/50 flex-row items-center gap-1.5`}>
                  <Text style={tw`text-xs text-slate-300 font-bold`}>{p.name}</Text>
                  {!p.micEnabled && <MicOff size={12} color="#ef4444" />}
                </View>
              </View>
            );
          })()}

          {/* Floating Local Stream (PiP) */}
          <View
            style={[
              tw`absolute top-16 right-4 w-28 h-40 rounded-2xl bg-[#0c1220] border-2 overflow-hidden justify-center items-center shadow-2xl`,
              {
                borderColor: micEnabled ? '#3b82f6' : '#1e293b',
              },
            ]}
          >
            {videoEnabled && localStream ? (
              <RTCView
                streamURL={localStream.toURL()}
                style={tw`absolute inset-0 w-full h-full`}
                objectFit="cover"
              />
            ) : (
              <View style={tw`items-center gap-1.5`}>
                <View style={tw`w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 items-center justify-center`}>
                  <Text style={tw`text-blue-300 text-sm font-bold`}>
                    {user?.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={tw`text-[9px] text-slate-400 font-semibold`}>You</Text>
              </View>
            )}

            {/* Local tag overlay */}
            <View style={tw`absolute bottom-2 left-2 bg-[#0c1220]/80 px-1.5 py-0.5 rounded border border-[#1e293b]/50 flex-row items-center gap-1`}>
              <Text style={tw`text-[8px] text-slate-300 font-bold`}>You</Text>
              {!micEnabled && <MicOff size={8} color="#ef4444" />}
            </View>
          </View>
        </View>
      ) : (
        // Grid Layout (For 1 participant or 3+ participants)
        <View style={tw`flex-1 p-3 gap-3 flex-row flex-wrap justify-center items-center`}>
          {/* Local Stream view */}
          <View
            style={[
              tw`relative rounded-2xl bg-[#0c1220] border overflow-hidden justify-center items-center`,
              {
                width: isSingle ? width - 24 : (width - 36) / 2,
                height: isSingle ? '80%' : '45%',
                borderColor: micEnabled ? '#3b82f6' : '#1e293b',
              },
            ]}
          >
            {videoEnabled && localStream ? (
              <RTCView
                streamURL={localStream.toURL()}
                style={tw`absolute inset-0 w-full h-full`}
                objectFit="contain"
              />
            ) : (
              <View style={tw`items-center gap-2`}>
                <View style={tw`w-14 h-14 rounded-full bg-blue-600/10 border border-blue-500/20 items-center justify-center`}>
                  <Text style={tw`text-blue-300 text-lg font-bold`}>
                    {user?.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={tw`text-xs text-slate-400 font-semibold`}>{user?.name} (You)</Text>
              </View>
            )}

            {/* Speaking badge */}
            {micEnabled && (
              <View style={tw`absolute top-3 right-3 bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded-md flex-row items-center gap-1`}>
                <View style={tw`h-1.5 w-1.5 rounded-full bg-blue-400`} />
                <Text style={tw`text-[8px] text-blue-400 font-bold uppercase`}>Speaking</Text>
              </View>
            )}

            {/* Name tag */}
            <View style={tw`absolute bottom-3 left-3 bg-[#0c1220]/80 px-2.5 py-1 rounded-md border border-[#1e293b]/50 flex-row items-center gap-1.5`}>
              <Text style={tw`text-[10px] text-slate-300 font-bold`}>{user?.name} (You)</Text>
              {!micEnabled && <MicOff size={10} color="#ef4444" />}
            </View>
          </View>

          {/* Remote Streams view */}
          {participants.map((p) => {
            const isSpeaking = p.micEnabled;
            const hasStream = p.videoEnabled && p.stream;

            return (
              <View
                key={p.socketId}
                style={[
                  tw`relative rounded-2xl bg-[#0c1220] border overflow-hidden justify-center items-center`,
                  {
                    width: (width - 36) / 2,
                    height: '45%',
                    borderColor: isSpeaking ? '#3b82f6' : '#1e293b',
                  },
                ]}
              >
                {hasStream ? (
                  <RTCView
                    streamURL={p.stream.toURL()}
                    style={tw`absolute inset-0 w-full h-full`}
                    objectFit="contain"
                  />
                ) : (
                  <View style={tw`items-center gap-2`}>
                    <View style={tw`w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/20 items-center justify-center`}>
                      <Text style={tw`text-blue-300 text-base font-bold`}>
                        {p.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={tw`text-[10px] text-slate-400 font-semibold`}>{p.name}</Text>
                  </View>
                )}

                {/* Speaking badge */}
                {isSpeaking && (
                  <View style={tw`absolute top-3 right-3 bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded-md flex-row items-center gap-1`}>
                    <View style={tw`h-1.5 w-1.5 rounded-full bg-blue-400`} />
                    <Text style={tw`text-[8px] text-blue-400 font-bold uppercase`}>Speaking</Text>
                  </View>
                )}

                {/* Name tag */}
                <View style={tw`absolute bottom-3 left-3 bg-[#0c1220]/80 px-2.5 py-1 rounded-md border border-[#1e293b]/50 flex-row items-center gap-1.5`}>
                  <Text style={tw`text-[10px] text-slate-300 font-bold`}>{p.name}</Text>
                  {!p.micEnabled && <MicOff size={10} color="#ef4444" />}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Control toolbar */}
      <View style={tw`h-22 bg-[#0c1220]/80 border-t border-[#1e293b] flex-row justify-center items-center gap-4 px-6`}>
        {/* Toggle Mic */}
        <TouchableOpacity
          onPress={handleToggleMic}
          style={[
            tw`p-3.5 rounded-full border`,
            micEnabled ? tw`bg-slate-900 border-[#334155]/50` : tw`bg-red-600 border-transparent`,
          ]}
          activeOpacity={0.7}
        >
          {micEnabled ? <Mic size={18} color="#e2e8f0" /> : <MicOff size={18} color="white" />}
        </TouchableOpacity>

        {/* Toggle Video */}
        <TouchableOpacity
          onPress={handleToggleVideo}
          style={[
            tw`p-3.5 rounded-full border`,
            videoEnabled ? tw`bg-slate-900 border-[#334155]/50` : tw`bg-red-600 border-transparent`,
          ]}
          activeOpacity={0.7}
        >
          {videoEnabled ? <VideoIcon size={18} color="#e2e8f0" /> : <VideoOff size={18} color="white" />}
        </TouchableOpacity>

        {/* Switch Camera */}
        <TouchableOpacity
          onPress={handleSwitchCamera}
          disabled={!videoEnabled}
          style={[
            tw`p-3.5 rounded-full border border-[#334155]/50`,
            videoEnabled ? tw`bg-slate-900` : tw`bg-slate-800 opacity-40`,
          ]}
          activeOpacity={0.7}
        >
          <Camera size={18} color={videoEnabled ? '#e2e8f0' : '#475569'} />
        </TouchableOpacity>

        {/* Open Chat */}
        <TouchableOpacity
          onPress={() => setActiveModal('chat')}
          style={tw`p-3.5 rounded-full border border-[#334155]/50 bg-slate-900`}
          activeOpacity={0.7}
        >
          <MessageSquare size={18} color="#e2e8f0" />
        </TouchableOpacity>

        {/* Open Participants */}
        <TouchableOpacity
          onPress={() => setActiveModal('participants')}
          style={tw`p-3.5 rounded-full border border-[#334155]/50 bg-slate-900`}
          activeOpacity={0.7}
        >
          <Users size={18} color="#e2e8f0" />
        </TouchableOpacity>

        {/* Hang Up */}
        <TouchableOpacity
          onPress={handleHangUp}
          style={tw`p-3.5 rounded-full bg-red-600`}
          activeOpacity={0.7}
        >
          <PhoneOff size={18} color="white" />
        </TouchableOpacity>
      </View>

      {/* Modal - Chat */}
      <Modal
        visible={activeModal === 'chat'}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveModal(null)}
      >
        <SafeAreaView style={tw`flex-1 bg-black/60 justify-end`}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={tw`bg-[#0c1220] border-t border-[#1e293b] rounded-t-3xl h-2/3`}
          >
            {/* Header */}
            <View style={tw`flex-row justify-between items-center px-5 py-4 border-b border-[#1e293b]`}>
              <Text style={tw`text-base font-bold text-white`}>Meeting Chat</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={tw`p-1`}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Messages List */}
            <FlatList
              data={messages}
              keyExtractor={(_, i) => i.toString()}
              contentContainerStyle={tw`p-5 gap-4`}
              renderItem={({ item }) => {
                const isSystem = item.sender === 'System';
                const isSelf = item.sender === user?.name;

                return (
                  <View style={[tw`max-w-[80%] rounded-2xl p-3.5`, 
                    isSystem ? tw`bg-slate-950/40 border border-slate-900/60 self-center max-w-full` :
                    isSelf ? tw`bg-blue-600 self-end` : tw`bg-slate-900 self-start`
                  ]}>
                    {!isSystem && !isSelf && (
                      <Text style={tw`text-[10px] text-blue-400 font-bold mb-1 uppercase`}>{item.sender}</Text>
                    )}
                    <Text style={tw`text-xs text-white leading-5`}>{item.text}</Text>
                    <Text style={tw`text-[8px] text-slate-400 text-right mt-1.5`}>{item.time}</Text>
                  </View>
                );
              }}
            />

            {/* Input wrap */}
            <View style={tw`flex-row items-center gap-2.5 p-4 border-t border-[#1e293b] bg-[#050811]`}>
              <TextInput
                placeholder="Type a message..."
                placeholderTextColor="#475569"
                style={tw`flex-1 bg-[#0c1220] text-white text-xs px-4 h-10 rounded-xl border border-[#1e293b]`}
                value={inputText}
                onChangeText={setInputText}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!inputText.trim()}
                style={[tw`w-10 h-10 rounded-xl items-center justify-center`, inputText.trim() ? tw`bg-blue-600` : tw`bg-slate-800` ]}
              >
                <Send size={15} color={inputText.trim() ? 'white' : '#64748b'} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Modal - Participants */}
      <Modal
        visible={activeModal === 'participants'}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveModal(null)}
      >
        <SafeAreaView style={tw`flex-1 bg-black/60 justify-end`}>
          <View style={tw`bg-[#0c1220] border-t border-[#1e293b] rounded-t-3xl h-1/2`}>
            {/* Header */}
            <View style={tw`flex-row justify-between items-center px-5 py-4 border-b border-[#1e293b]`}>
              <Text style={tw`text-base font-bold text-white`}>Participants ({participants.length + 1})</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={tw`p-1`}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
              data={[{ name: `${user?.name} (You)`, micEnabled, videoEnabled, isSelf: true }, ...participants]}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={tw`p-5 gap-3.5`}
              renderItem={({ item }: any) => (
                <View style={tw`flex-row items-center justify-between bg-slate-950/40 border border-slate-900 px-4 py-3 rounded-xl`}>
                  <View style={tw`flex-row items-center gap-3`}>
                    <View style={tw`w-8 h-8 rounded-full bg-blue-600/15 border border-blue-500/20 items-center justify-center`}>
                      <Text style={tw`text-blue-300 text-xs font-bold`}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={tw`text-xs text-white font-semibold`}>{item.name}</Text>
                  </View>

                  <View style={tw`flex-row gap-2`}>
                    {item.micEnabled ? <Mic size={14} color="#10b981" /> : <MicOff size={14} color="#ef4444" />}
                    {item.videoEnabled ? <VideoIcon size={14} color="#10b981" /> : <VideoOff size={14} color="#ef4444" />}
                  </View>
                </View>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
