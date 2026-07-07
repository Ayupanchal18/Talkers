import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Clipboard,
  Platform,
  StatusBar,
} from 'react-native';
import { mediaDevices, RTCView } from 'react-native-webrtc';
import * as Lucide from 'lucide-react-native';
import tw from 'twrnc';
import { Spinner } from '../../../shared/components/Loading';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { API_URL } from '../../../shared/constants';

const Video = Lucide.Video as any;
const VideoOff = Lucide.VideoOff as any;
const Mic = Lucide.Mic as any;
const MicOff = Lucide.MicOff as any;
const Copy = Lucide.Copy as any;
const Check = Lucide.Check as any;
const AlertTriangle = Lucide.AlertTriangle as any;
const CameraIcon = Lucide.Camera as any;
const Headphones = Lucide.Headphones as any;
const ArrowRight = Lucide.ArrowRight as any;

interface LobbyPageProps {
  route: any;
  navigation: any;
}

export default function LobbyPage({ route, navigation }: LobbyPageProps) {
  const { code } = route.params;
  const { accessToken } = useAuthStore();

  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [localStream, setLocalStream] = useState<any>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [devices, setDevices] = useState<any[]>([]);

  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [roomTitle, setRoomTitle] = useState('Lobby');

  const activeStreamRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    const verifyRoom = async () => {
      try {
        const response = await fetch(`${API_URL}/api/meetings/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ code }),
        });

        if (!active) return;

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to join meeting');
        }

        const data = await response.json();
        setRoomTitle(data.title);
      } catch (err: any) {
        if (!active) return;
        setValidationError(err.message);
      } finally {
        if (active) setIsValidating(false);
      }
    };

    verifyRoom();
    return () => {
      active = false;
    };
  }, [code, accessToken]);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const list = await mediaDevices.enumerateDevices() as any[];
        setDevices(list);
      } catch (err) {
        console.warn('[Lobby] Failed to enumerate devices:', err);
      }
    };
    getDevices();
  }, []);

  useEffect(() => {
    let active = true;

    const startPreview = async () => {
      // Stop old tracks first
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track: any) => track.stop());
        activeStreamRef.current = null;
      }
      setPermissionError(null);

      if (!videoEnabled && !micEnabled) {
        setLocalStream(null);
        return;
      }

      try {
        const stream = await mediaDevices.getUserMedia({
          video: videoEnabled ? {
            facingMode: 'user', // front camera
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          } : false,
          audio: micEnabled ? ({
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } as any) : false,
        });

        if (!active) {
          stream.getTracks().forEach((track: any) => track.stop());
          return;
        }

        setLocalStream(stream);
        activeStreamRef.current = stream;
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
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track: any) => track.stop());
      }
    };
  }, [videoEnabled, micEnabled]);

  const handleCopyLink = () => {
    // Replicating web URL representation
    Clipboard.setString(`https://vidss-frontend.onrender.com/room/${code}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleJoinCall = () => {
    // Pass media configurations to Room Screen
    navigation.navigate('Room', {
      code,
      initialMic: micEnabled,
      initialVideo: videoEnabled,
    });
  };

  const camerasCount = devices.filter((d) => d.kind === 'videoinput').length || (videoEnabled ? 1 : 0);
  const micsCount = devices.filter((d) => d.kind === 'audioinput').length || (micEnabled ? 1 : 0);

  if (isValidating) {
    return (
      <SafeAreaView style={[tw`flex-1 bg-[#050811] justify-center items-center`, Platform.OS === 'android' ? { paddingTop: StatusBar.currentHeight || 0 } : null]}>
        <Spinner size="large" />
        <Text style={tw`text-slate-400 text-xs font-semibold mt-4`}>Verifying meeting room...</Text>
      </SafeAreaView>
    );
  }

  if (validationError) {
    return (
      <SafeAreaView style={[tw`flex-1 bg-[#050811] justify-center items-center px-6`, Platform.OS === 'android' ? { paddingTop: StatusBar.currentHeight || 0 } : null]}>
        <View style={tw`w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4`}>
          <AlertTriangle size={24} color="#ef4444" />
        </View>
        <Text style={tw`text-lg font-bold text-white text-center mb-2`}>Meeting Unavailable</Text>
        <Text style={tw`text-sm text-slate-450 text-center mb-6 leading-5`}>{validationError}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          style={tw`bg-blue-600 px-6 py-3 rounded-xl`}
          activeOpacity={0.8}
        >
          <Text style={tw`text-white font-bold text-sm`}>Go Back Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[tw`flex-1 bg-[#050811] justify-between py-6`, Platform.OS === 'android' ? { paddingTop: StatusBar.currentHeight || 0 } : null]}>
      {/* Header */}
      <View style={tw`px-6 flex-row items-center gap-3`}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={tw`bg-slate-900 border border-slate-800 p-2.5 rounded-xl`}
          activeOpacity={0.7}
        >
          <ArrowRight size={16} color="#94a3b8" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <View style={tw`gap-0.5`}>
          <Text style={tw`text-lg font-bold text-white`}>{roomTitle}</Text>
          <Text style={tw`text-xs text-slate-400 font-semibold`}>Verify settings before joining</Text>
        </View>
      </View>

      {/* Camera Preview */}
      <View style={tw`px-6 flex-grow justify-center py-4`}>
        <View style={tw`aspect-video w-full rounded-2xl bg-[#0c1220] border border-[#1e293b] overflow-hidden justify-center items-center relative`}>
          {permissionError ? (
            <View style={tw`items-center px-6 gap-3`}>
              <View style={tw`w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center`}>
                <AlertTriangle size={22} color="#f59e0b" />
              </View>
              <Text style={tw`text-sm font-semibold text-amber-300`}>Camera access blocked</Text>
              <Text style={tw`text-xs text-slate-500 text-center leading-5`}>{permissionError}</Text>
            </View>
          ) : (!videoEnabled || !localStream) ? (
            <View style={tw`items-center gap-3`}>
              <View style={tw`w-12 h-12 rounded-full bg-slate-900 border border-[#1e293b] flex items-center justify-center`}>
                <VideoOff size={20} color="#475569" />
              </View>
              <Text style={tw`text-xs text-slate-500 font-semibold`}>Camera is off</Text>
            </View>
          ) : (
            <RTCView
              streamURL={localStream.toURL()}
              style={tw`absolute inset-0 w-full h-full`}
              objectFit="contain"
            />
          )}

          {/* Mic indicator badge */}
          {localStream && !permissionError && (
            <View style={tw`absolute bottom-3 left-3 bg-[#0c1220]/80 border border-[#1e293b]/60 px-3 py-1.5 rounded-lg flex-row items-center gap-1.5`}>
              {micEnabled ? (
                <>
                  <Mic size={12} color="#10b981" />
                  <Text style={tw`text-[10px] text-green-400 font-bold uppercase`}>Mic on</Text>
                </>
              ) : (
                <>
                  <MicOff size={12} color="#ef4444" />
                  <Text style={tw`text-[10px] text-red-400 font-bold uppercase`}>Muted</Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* Media Control Toggle Buttons */}
        <View style={tw`flex-row justify-center gap-6 mt-6`}>
          <View style={tw`items-center gap-1.5`}>
            <TouchableOpacity
              onPress={() => setMicEnabled(!micEnabled)}
              style={[
                tw`p-4 rounded-full border`,
                micEnabled 
                  ? tw`bg-slate-900 border-[#334155]/50 text-slate-200`
                  : tw`bg-red-600 border-transparent shadow-lg shadow-red-900/30`,
              ]}
              activeOpacity={0.7}
            >
              {micEnabled ? <Mic size={20} color="#e2e8f0" /> : <MicOff size={20} color="white" />}
            </TouchableOpacity>
            <Text style={tw`text-[10px] text-slate-500 font-semibold uppercase tracking-wider`}>
              {micEnabled ? 'Mute' : 'Unmuted'}
            </Text>
          </View>

          <View style={tw`items-center gap-1.5`}>
            <TouchableOpacity
              onPress={() => setVideoEnabled(!videoEnabled)}
              style={[
                tw`p-4 rounded-full border`,
                videoEnabled 
                  ? tw`bg-slate-900 border-[#334155]/50 text-slate-200`
                  : tw`bg-red-600 border-transparent shadow-lg shadow-red-900/30`,
              ]}
              activeOpacity={0.7}
            >
              {videoEnabled ? <Video size={20} color="#e2e8f0" /> : <VideoOff size={20} color="white" />}
            </TouchableOpacity>
            <Text style={tw`text-[10px] text-slate-500 font-semibold uppercase tracking-wider`}>
              {videoEnabled ? 'Stop' : 'Start'}
            </Text>
          </View>
        </View>
      </View>

      {/* Control Info & Join Panel */}
      <View style={tw`px-6 gap-5`}>
        {/* Info Box */}
        <View style={tw`bg-[#0c1220]/50 border border-slate-900 rounded-2xl p-5 gap-3`}>
          <View style={tw`gap-1`}>
            <Text style={tw`text-base font-bold text-white`}>Ready to join?</Text>
            <Text style={tw`text-xs text-slate-400`}>Room Code: <Text style={tw`font-mono text-blue-400 font-bold`}>{code}</Text></Text>
          </View>

          {/* Detected device counts */}
          <View style={tw`border-t border-slate-900 pt-3 gap-2.5`}>
            <View style={tw`flex-row justify-between items-center`}>
              <View style={tw`flex-row items-center gap-2`}>
                <View style={tw`w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center`}>
                  <CameraIcon size={12} color="#3b82f6" />
                </View>
                <Text style={tw`text-xs text-slate-400`}>Camera devices</Text>
              </View>
              <Text style={tw`text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md`}>
                {camerasCount}
              </Text>
            </View>
            <View style={tw`flex-row justify-between items-center`}>
              <View style={tw`flex-row items-center gap-2`}>
                <View style={tw`w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center`}>
                  <Headphones size={12} color="#a855f7" />
                </View>
                <Text style={tw`text-xs text-slate-400`}>Microphones</Text>
              </View>
              <Text style={tw`text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md`}>
                {micsCount}
              </Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View style={tw`gap-3`}>
          <TouchableOpacity
            onPress={handleCopyLink}
            style={tw`flex-row justify-center items-center gap-2 bg-slate-900 border border-slate-800 h-11 rounded-xl`}
            activeOpacity={0.7}
          >
            {isCopied ? (
              <>
                <Check size={14} color="#10b981" />
                <Text style={tw`text-green-400 text-xs font-semibold`}>Copied!</Text>
              </>
            ) : (
              <>
                <Copy size={14} color="#94a3b8" />
                <Text style={tw`text-slate-300 text-xs font-semibold`}>Copy Invite Link</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleJoinCall}
            style={tw`flex-row justify-center items-center gap-2 bg-blue-600 h-12 rounded-xl`}
            activeOpacity={0.8}
          >
            <Text style={tw`text-white font-bold text-sm`}>Join Now</Text>
            <ArrowRight size={14} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
