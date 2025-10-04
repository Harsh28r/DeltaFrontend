"use client";
import React from 'react';
import { Icon } from '@iconify/react';
import { useWebSocket } from '@/app/context/WebSocketContext';

interface WebSocketStatusProps {
  className?: string;
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ className = "" }) => {
  const { connected } = useWebSocket();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
      <Icon 
        icon={connected ? 'solar:wi-fi-router-line-duotone' : 'solar:wi-fi-router-minimalistic-line-duotone'} 
        className={`text-sm ${connected ? 'text-green-400' : 'text-red-400'}`} 
      />
      <span className={`text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
        {connected ? 'Live' : 'Offline'}
      </span>
    </div>
  );
};

export default WebSocketStatus;
