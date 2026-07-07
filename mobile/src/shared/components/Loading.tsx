import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import tw from 'twrnc';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

export function Spinner({ size = 'small', color = '#3b82f6' }: SpinnerProps) {
  return (
    <ActivityIndicator size={size} color={color} />
  );
}

export function PageLoader() {
  return (
    <View style={tw`flex-1 bg-[#0c1220] justify-center items-center gap-4`}>
      <Spinner size="large" />
      <Text style={tw`text-slate-400 text-sm font-medium tracking-wide`}>Loading…</Text>
    </View>
  );
}

interface SkeletonProps {
  style?: any;
}

export function Skeleton({ style }: SkeletonProps) {
  return <View style={[tw`bg-slate-800/50 rounded-lg animate-pulse`, style]} />;
}
