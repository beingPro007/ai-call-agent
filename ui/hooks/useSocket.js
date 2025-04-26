import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

/**
 * Optimized useSocket hook:
 * - Returns [socket, requestTTS]
 * - Manages connect/disconnect automatically
 */
export const useSocket = (serverUrl = 'http://localhost:3000') => {
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const socket = io(serverUrl, { transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            console.log('✅ Connected:', socket.id);
        });

        socket.on('disconnect', () => {
            setConnected(false);
            console.log('⚠️ Disconnected');
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [serverUrl]);

    const requestTTS = (text) => {
        const sock = socketRef.current;
        if (!sock || !connected) {
            console.warn('Socket not connected');
            return;
        }
        sock.emit('request-tts', text);
    };

    return [socketRef.current, requestTTS];
};
