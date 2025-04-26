import { useState, useRef, useEffect } from 'react';
import { connect, LocalAudioTrack } from 'livekit-client';
import axios from 'axios';

const useLiveKit = (isRecording, onAudioPublished) => {
    const [room, setRoom] = useState(null);
    const [localAudioTrack, setLocalAudioTrack] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [token, setToken] = useState(null);

    useEffect(() => {
      const getToken = async () => {
        try {
          const response = await axios.get("http://localhost:3000/token");
          setToken(response.data.token); 
        } catch (error) {
          console.error("Error fetching token:", error);
        }
      };

      if (isRecording) {
        getToken(); // Get token only if recording is starting
      }
    }, [isRecording]);

    // This is where we keep track of the connection and room status
    useEffect(() => {
        if (isRecording) {
            const connectToRoom = async () => {
                try {
                    const room = await connect('ws://your-livekit-server-url', {
                        token: 'your-livekit-access-token', // You'll get this token after creating a room on the server
                    });

                    setRoom(room);
                    setIsConnected(true);

                    // Create the local audio track (microphone track)
                    const localTrack = await LocalAudioTrack.create();
                    setLocalAudioTrack(localTrack);

                    // Publish the local track to LiveKit
                    room.localParticipant.publishTrack(localTrack);

                    console.log('🎙️ Local audio track published');
                } catch (err) {
                    console.error('Error connecting to LiveKit:', err);
                    setIsConnected(false);
                }
            };

            connectToRoom();
        } else {
            // Disconnect and clean up when not recording
            if (room) {
                room.disconnect();
                setRoom(null);
                setIsConnected(false);
            }
        }

        return () => {
            if (room) {
                room.disconnect();
                setRoom(null);
            }
        };
    }, [isRecording]);

    // Return the necessary LiveKit state
    return {
        room,
        localAudioTrack,
        isConnected,
    };
};

export default useLiveKit;
