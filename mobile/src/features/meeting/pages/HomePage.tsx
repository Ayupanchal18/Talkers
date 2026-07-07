import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import * as Lucide from 'lucide-react-native';
import tw from 'twrnc';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { API_URL } from '../../../shared/constants';
import { Spinner } from '../../../shared/components/Loading';

const Video = Lucide.Video as any;
const ArrowRight = Lucide.ArrowRight as any;
const AlertCircle = Lucide.AlertCircle as any;
const Users = Lucide.Users as any;
const Monitor = Lucide.Monitor as any;
const Link2 = Lucide.Link2 as any;
const Hash = Lucide.Hash as any;
const LogOut = Lucide.LogOut as any;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

interface HomePageProps {
  navigation: any;
}

export default function HomePage({ navigation }: HomePageProps) {
  const { user, accessToken, logout } = useAuthStore();
  const [meetingCode, setMeetingCode] = useState('');
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateMeeting = async () => {
    if (isCreating) return;
    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title: title || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create meeting');
      
      navigation.navigate('Lobby', { code: data.data.meeting.code });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meeting');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMeeting = async () => {
    if (!meetingCode.trim() || isJoining) return;
    setIsJoining(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/meetings/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ code: meetingCode.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Meeting not found');
      
      navigation.navigate('Lobby', { code: data.data.meeting.code });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join meeting');
    } finally {
      setIsJoining(false);
    }
  };

  const firstName = user?.name.split(' ')[0] || 'there';

  const featureCards = [
    {
      icon: Video,
      label: 'Instant Video',
      desc: 'Start a meeting in one click',
      color: 'border-blue-500/20 bg-blue-500/5',
      iconColor: '#3b82f6',
    },
    {
      icon: Users,
      label: 'Team Meeting',
      desc: 'Invite multiple participants',
      color: 'border-emerald-500/20 bg-emerald-500/5',
      iconColor: '#10b981',
    },
    {
      icon: Monitor,
      label: 'Screen Share',
      desc: 'Present your screen live',
      color: 'border-amber-500/20 bg-amber-500/5',
      iconColor: '#f59e0b',
    },
  ];

  return (
    <SafeAreaView style={[tw`flex-1 bg-[#050811]`, Platform.OS === 'android' ? { paddingTop: StatusBar.currentHeight || 0 } : null]}>
      {/* Header with App Title & Logout */}
      <View style={tw`flex-row justify-between items-center px-6 py-4 border-b border-slate-900 bg-[#0c1220]/50`}>
        <View style={tw`flex-row items-center gap-2`}>
          <View style={tw`w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center`}>
            <Video size={15} color="white" />
          </View>
          <Text style={tw`text-lg font-bold text-white tracking-wide`}>Vidss</Text>
        </View>
        <TouchableOpacity 
          onPress={logout}
          style={tw`flex-row items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg`}
          activeOpacity={0.7}
        >
          <LogOut size={13} color="#64748b" />
          <Text style={tw`text-slate-400 text-xs font-semibold`}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={tw`px-6 py-6 gap-6`}>
        {/* Greeting */}
        <View style={tw`gap-1`}>
          <Text style={tw`text-2xl font-bold text-white tracking-tight`}>
            {getGreeting()}, {firstName} 👋
          </Text>
          <Text style={tw`text-slate-400 text-sm font-medium`}>
            Start or join a meeting below
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={tw`flex-row items-center gap-3 bg-red-950/40 border border-red-500/30 rounded-xl p-4`}>
            <AlertCircle size={16} color="#ef4444" />
            <Text style={tw`text-red-300 text-xs flex-1 font-medium`}>{error}</Text>
          </View>
        )}

        {/* Primary Actions */}
        <View style={tw`gap-4`}>
          <TouchableOpacity
            onPress={handleCreateMeeting}
            disabled={isCreating || isJoining}
            style={tw`flex-row justify-center items-center h-12 rounded-xl bg-blue-600 gap-2 shadow-lg shadow-blue-500/20`}
            activeOpacity={0.8}
          >
            {isCreating ? <Spinner color="white" /> : <Video size={16} color="white" />}
            <Text style={tw`text-white font-bold text-sm tracking-wide`}>New Meeting</Text>
          </TouchableOpacity>

          {/* Join Meeting Input/Button */}
          <View style={tw`flex-row gap-2.5`}>
            <View style={tw`flex-row items-center bg-[#0c1220] border border-[#1e293b] rounded-xl px-4 h-12 flex-grow`}>
              <Hash size={15} color="#475569" style={tw`mr-2`} />
              <TextInput
                placeholder="Enter meeting code"
                placeholderTextColor="#475569"
                style={tw`text-white text-sm flex-1`}
                value={meetingCode}
                onChangeText={setMeetingCode}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isCreating && !isJoining}
              />
            </View>
            <TouchableOpacity
              onPress={handleJoinMeeting}
              disabled={!meetingCode.trim() || isCreating || isJoining}
              style={[
                tw`w-14 justify-center items-center rounded-xl h-12`,
                !meetingCode.trim() || isCreating || isJoining ? tw`bg-slate-800` : tw`bg-blue-600/20 border border-blue-500/30`,
              ]}
              activeOpacity={0.8}
            >
              {isJoining ? (
                <Spinner color="#3b82f6" />
              ) : (
                <ArrowRight size={16} color={!meetingCode.trim() ? '#475569' : '#3b82f6'} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Feature Cards Grid */}
        <View style={tw`gap-3`}>
          {featureCards.map(({ icon: Icon, label, desc, color, iconColor }) => (
            <View key={label} style={tw`flex-row items-center gap-4 p-4 border rounded-2xl ${color}`}>
              <View style={tw`w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center`}>
                <Icon size={18} color={iconColor} />
              </View>
              <View style={tw`flex-1 gap-0.5`}>
                <Text style={tw`text-white font-bold text-sm`}>{label}</Text>
                <Text style={tw`text-slate-400 text-xs font-medium`}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Create with Topic Input/Button */}
        <View style={tw`bg-[#0c1220]/40 border border-slate-900 rounded-2xl p-5 gap-3.5`}>
          <Text style={tw`text-slate-300 text-xs font-bold uppercase tracking-wider`}>
            Or start with a topic
          </Text>
          <View style={tw`gap-3`}>
            <TextInput
              placeholder="e.g. Weekly Sync, Design Review…"
              placeholderTextColor="#475569"
              style={tw`bg-[#0c1220] border border-[#1e293b] text-white text-sm px-4 h-11 rounded-xl`}
              value={title}
              onChangeText={setTitle}
              editable={!isCreating}
            />
            <TouchableOpacity
              onPress={handleCreateMeeting}
              disabled={isCreating || isJoining || !title.trim()}
              style={[
                tw`flex-row justify-center items-center h-11 rounded-xl gap-2`,
                isCreating || !title.trim() ? tw`bg-blue-600/40` : tw`bg-blue-600`,
              ]}
              activeOpacity={0.8}
            >
              {isCreating ? <Spinner color="white" /> : <Link2 size={15} color="white" />}
              <Text style={tw`text-white font-bold text-sm tracking-wide`}>Start Meeting</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
