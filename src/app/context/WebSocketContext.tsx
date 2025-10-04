"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/lib/config';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  subscribeToReminders: () => void;
  subscribeToProject: (projectId: string) => void;
  subscribeToAllLeads: () => void;
  subscribeToLeadSources: () => void;
  subscribeToLeadStatuses: () => void;
  subscribeToLead: (leadId: string) => void;
  unsubscribeFromLead: (leadId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      setConnected(false);
      return;
    }

    // Connect to WebSocket with auth token
    const socketInstance = io(API_BASE_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected');
      console.log('Socket ID:', socketInstance.id);
      setConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('⚠️ WebSocket disconnected:', reason);
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setConnected(false);
    });

    // Add general event logging for debugging
    socketInstance.onAny((eventName, ...args) => {
      console.log(`🔔 WebSocket event received: ${eventName}`, args);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  const joinProject = (projectId: string) => {
    if (socket) {
      socket.emit('join-project', projectId);
    }
  };

  const leaveProject = (projectId: string) => {
    if (socket) {
      socket.emit('leave-project', projectId);
    }
  };

  const subscribeToReminders = () => {
    if (socket) {
      socket.emit('subscribe-reminders');
    }
  };

  const subscribeToProject = (projectId: string) => {
    if (socket) {
      socket.emit('join-project', projectId);
    }
  };

  const subscribeToAllLeads = () => {
    if (socket) {
      socket.emit('subscribe-all-leads');
    }
  };

  const subscribeToLeadSources = () => {
    if (socket) {
      socket.emit('subscribe-lead-sources');
    }
  };

  const subscribeToLeadStatuses = () => {
    if (socket) {
      socket.emit('subscribe-lead-statuses');
    }
  };

  const subscribeToLead = (leadId: string) => {
    if (socket) {
      socket.emit('subscribe-lead', leadId);
    }
  };

  const unsubscribeFromLead = (leadId: string) => {
    if (socket) {
      socket.emit('unsubscribe-lead', leadId);
    }
  };

  const value: WebSocketContextType = {
    socket,
    connected,
    joinProject,
    leaveProject,
    subscribeToReminders,
    subscribeToProject,
    subscribeToAllLeads,
    subscribeToLeadSources,
    subscribeToLeadStatuses,
    subscribeToLead,
    unsubscribeFromLead,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
