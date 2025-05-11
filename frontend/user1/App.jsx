import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://browser-voice-call.onrender.com');
const roomId = 'highchat-room';

function Admin() {
  const localAudioRef = useRef();
  const remoteAudioRef = useRef();
  const [pc, setPc] = useState(null);
  const [incoming, setIncoming] = useState(false);
  const [connected, setConnected] = useState(false);
  const iceQueue = useRef([]);

  useEffect(() => {
    socket.emit('join', roomId);

    socket.on('incoming-call', () => {
      setIncoming(true);
    });

    socket.on('call-accepted', () => {
      createOffer();
    });

    socket.on('offer', async ({ offer }) => {
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // STUN and TURN servers configuration with Bistri TURN server
      const iceServers = [
        {
          urls: 'stun:stun.l.google.com:19302', // Free Google STUN server
        },
        {
          urls: 'turn:turn.bistri.com:80', // Bistri TURN server
          username: 'homeo',  // Replace with your TURN server username
          credential: 'homeo',  // Replace with your TURN server password
        },
      ];

      const peerConnectionConfig = {
        iceServers,
      };

      const peerConnection = new RTCPeerConnection(peerConnectionConfig);

      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
      if (localAudioRef.current) localAudioRef.current.srcObject = localStream;

      peerConnection.ontrack = event => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          socket.emit('ice-candidate', { candidate: event.candidate, roomId });
        }
      };

      // Only attempt to set remote description if the peer connection is not closed
      if (peerConnection.signalingState !== 'closed') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      }

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit('answer', { answer, roomId });

      setPc(peerConnection);
      setConnected(true);

      // Process any queued candidates
      iceQueue.current.forEach(c => peerConnection.addIceCandidate(new RTCIceCandidate(c)));
      iceQueue.current = [];
    });

    socket.on('answer', async ({ answer }) => {
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', ({ candidate }) => {
      if (pc && pc.signalingState !== 'closed') {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        iceQueue.current.push(candidate);
      }
    });

    socket.on('call-ended', () => {
      pc?.close();
      setConnected(false);
      setIncoming(false);
    });
  }, [pc]);

  const createOffer = async () => {
    const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // STUN and TURN servers configuration with Bistri TURN server
    const iceServers = [
      {
        urls: 'stun:stun.l.google.com:19302', // Free Google STUN server
      },
      {
        urls: 'turn:turn.bistri.com:80', // Bistri TURN server
        username: 'homeo',  // Replace with your TURN server username
        credential: 'homeo',  // Replace with your TURN server password
      },
    ];

    const peerConnectionConfig = {
      iceServers,
    };

    const peerConnection = new RTCPeerConnection(peerConnectionConfig);

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    if (localAudioRef.current) localAudioRef.current.srcObject = localStream;

    peerConnection.ontrack = event => {
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('ice-candidate', { candidate: event.candidate, roomId });
      }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit('offer', { offer, roomId });
    setPc(peerConnection);
    setConnected(true);
  };

  const startCall = () => {
    socket.emit('start-call', { roomId });
  };

  const acceptCall = () => {
    setIncoming(false);
    socket.emit('accept-call', { roomId });
  };

  const endCall = () => {
    pc?.close();
    setConnected(false);
    socket.emit('end-call', { roomId });
  };

  return (
    <div>
      <h2>Admin</h2>
      <audio ref={localAudioRef} autoPlay muted />
      <audio ref={remoteAudioRef} autoPlay />
      {incoming && !connected && <button onClick={acceptCall}>Accept Call</button>}
      {!connected && !incoming && <button onClick={startCall}>Start Call</button>}
      {connected && <button onClick={endCall}>End Call</button>}
    </div>
  );
}

export default Admin;
