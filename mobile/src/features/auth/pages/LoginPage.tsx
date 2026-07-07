import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Mail, Lock, AlertCircle, Video, ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import tw from 'twrnc';
import { useAuthStore } from '../store/useAuthStore';
import { Spinner } from '../../../shared/components/Loading';

interface LoginPageProps {
  onNavigateToRegister: () => void;
}

export default function LoginPage({ onNavigateToRegister }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, setError } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    try {
      await login(email.trim(), password);
    } catch (err) {
      console.warn('[Login] Error logged in store:', err);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#050811]`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <ScrollView
          contentContainerStyle={tw`flex-grow justify-center px-6 py-8`}
          keyboardShouldPersistTaps="handled"
        >
          {/* Orbs styling recreated with colored circles */}
          <View style={tw`absolute top-10 left-[-40px] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl`} />
          <View style={tw`absolute bottom-10 right-[-40px] w-64 h-64 bg-purple-500/10 rounded-full blur-3xl`} />

          {/* Logo */}
          <View style={tw`items-center mb-8`}>
            <View style={tw`flex-row items-center gap-3 bg-[#0c1220]/80 px-5 py-3 rounded-2xl border border-blue-500/20`}>
              <View style={tw`w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center`}>
                <Video size={20} color="white" />
              </View>
              <Text style={tw`text-2xl font-bold text-white tracking-wide`}>Vidss</Text>
            </View>
          </View>

          {/* Header */}
          <View style={tw`mb-8`}>
            <Text style={tw`text-3xl font-extrabold text-white text-center tracking-tight mb-2`}>
              Welcome back
            </Text>
            <Text style={tw`text-slate-400 text-center text-sm font-medium`}>
              Sign in to your Vidss account
            </Text>
          </View>

          {/* Error display */}
          {error && (
            <View style={tw`flex-row items-center gap-3 bg-red-950/40 border border-red-500/30 rounded-xl p-4 mb-6`}>
              <AlertCircle size={18} color="#ef4444" />
              <Text style={tw`text-red-300 text-xs flex-1 font-medium`}>{error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={tw`gap-5`}>
            {/* Email Field */}
            <View style={tw`gap-2`}>
              <Text style={tw`text-slate-300 text-xs font-semibold uppercase tracking-wider`}>
                Email address
              </Text>
              <View style={tw`flex-row items-center bg-[#0c1220] border border-[#1e293b] rounded-xl px-4 h-12`}>
                <Mail size={16} color="#64748b" style={tw`mr-3`} />
                <TextInput
                  placeholder="you@example.com"
                  placeholderTextColor="#475569"
                  style={tw`flex-1 text-white text-sm h-full`}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(null);
                  }}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={tw`gap-2`}>
              <Text style={tw`text-slate-300 text-xs font-semibold uppercase tracking-wider`}>
                Password
              </Text>
              <View style={tw`flex-row items-center bg-[#0c1220] border border-[#1e293b] rounded-xl px-4 h-12`}>
                <Lock size={16} color="#64748b" style={tw`mr-3`} />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#475569"
                  style={tw`flex-1 text-white text-sm h-full`}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError(null);
                  }}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={tw`p-1`}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={16} color="#64748b" />
                  ) : (
                    <Eye size={16} color="#64748b" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading || !email.trim() || !password.trim()}
              style={[
                tw`flex-row justify-center items-center h-12 rounded-xl mt-4`,
                isLoading || !email.trim() || !password.trim()
                  ? tw`bg-blue-600/50`
                  : tw`bg-blue-600 shadow-lg shadow-blue-500/20`,
              ]}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <Spinner color="white" />
              ) : (
                <View style={tw`flex-row items-center gap-2`}>
                  <Text style={tw`text-white font-bold text-sm tracking-wide`}>Sign in</Text>
                  <ArrowRight size={16} color="white" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={tw`flex-row justify-center items-center mt-8 gap-1.5`}>
            <Text style={tw`text-slate-400 text-sm font-medium`}>Don't have an account?</Text>
            <TouchableOpacity onPress={onNavigateToRegister} activeOpacity={0.7}>
              <Text style={tw`text-blue-400 text-sm font-bold`}>Create one free</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
