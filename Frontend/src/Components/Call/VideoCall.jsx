import { useCallback, useEffect, useRef, useState } from "react";
import "./VideoCall.css";

const VideoCall = ({ socket, roomId }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const peerConnectionRef = useRef(null);
  const streamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const pendingOfferRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [remoteCameraEnabled, setRemoteCameraEnabled] = useState(true);

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    peerConnectionRef.current = peerConnection;

    const localStream = streamRef.current;

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });
    }

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", {
          roomId,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];

      if (!remoteStream || !remoteVideoRef.current) {
        return;
      }

      remoteVideoRef.current.srcObject = remoteStream;

      remoteVideoRef.current.play().catch(() => {});
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(
        "🌐 WebRTC connection state:",
        peerConnection.connectionState,
      );
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(
        "🧊 ICE connection state:",
        peerConnection.iceConnectionState,
      );
    };

    return peerConnection;
  }, [socket, roomId]);

  const processOffer = useCallback(
    async (offer) => {
      try {
        if (!streamRef.current) {
          pendingOfferRef.current = offer;
          return;
        }

        const peerConnection = createPeerConnection();

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer),
        );

        for (const candidate of pendingCandidatesRef.current) {
          await peerConnection.addIceCandidate(candidate);
        }

        pendingCandidatesRef.current = [];

        const answer = await peerConnection.createAnswer();

        await peerConnection.setLocalDescription(answer);

        socket.emit("callAnswer", {
          roomId,
          answer,
        });
      } catch (error) {
        console.error("❌ Error processing WebRTC offer:", error);
      }
    },
    [createPeerConnection, socket, roomId],
  );

  const startCall = useCallback(async () => {
    if (!streamRef.current) {
      return;
    }

    try {
      const peerConnection = createPeerConnection();

      if (peerConnection.signalingState !== "stable") {
        return;
      }

      const offer = await peerConnection.createOffer();

      await peerConnection.setLocalDescription(offer);

      socket.emit("callOffer", {
        roomId,
        offer,
      });
    } catch (error) {
      console.error("❌ Failed to start call:", error);
    }
  }, [createPeerConnection, socket, roomId]);

  useEffect(() => {
    let localStream;

    const startMedia = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        streamRef.current = localStream;
        setStream(localStream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      } catch (error) {
        console.error("❌ Camera/Microphone access denied:", error);
      }
    };

    startMedia();

    return () => {
      localStream?.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!stream) {
      return;
    }

    const peerConnection = peerConnectionRef.current;

    if (peerConnection) {
      const existingTracks = peerConnection
        .getSenders()
        .map((sender) => sender.track);

      stream.getTracks().forEach((track) => {
        if (!existingTracks.includes(track)) {
          peerConnection.addTrack(track, stream);
        }
      });
    }

    if (pendingOfferRef.current) {
      const offer = pendingOfferRef.current;

      pendingOfferRef.current = null;

      processOffer(offer);
    }
  }, [stream, processOffer]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleCallOffer = ({ offer }) => {
      console.log("📥 WEBRTC OFFER RECEIVED");
      processOffer(offer);
    };

    socket.on("webrtcOffer", handleCallOffer);

    return () => {
      socket.off("webrtcOffer", handleCallOffer);
    };
  }, [socket, processOffer]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleCallAnswer = async ({ answer }) => {
      try {
        const peerConnection = peerConnectionRef.current;

        if (!peerConnection) {
          return;
        }

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer),
        );

        for (const candidate of pendingCandidatesRef.current) {
          await peerConnection.addIceCandidate(candidate);
        }

        pendingCandidatesRef.current = [];
      } catch (error) {
        console.error("❌ Error processing WebRTC answer:", error);
      }
    };

    socket.on("callAnswer", handleCallAnswer);

    return () => {
      socket.off("callAnswer", handleCallAnswer);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleIceCandidate = async ({ candidate }) => {
      try {
        if (!candidate) {
          return;
        }

        const iceCandidate = new RTCIceCandidate(candidate);

        const peerConnection = peerConnectionRef.current;

        if (!peerConnection || !peerConnection.remoteDescription) {
          pendingCandidatesRef.current.push(iceCandidate);
          return;
        }

        await peerConnection.addIceCandidate(iceCandidate);
      } catch (error) {
        console.error("❌ Failed to add ICE candidate:", error);
      }
    };

    socket.on("iceCandidate", handleIceCandidate);

    return () => {
      socket.off("iceCandidate", handleIceCandidate);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleStartCall = () => {
      startCall();
    };

    socket.on("startCall", handleStartCall);

    return () => {
      socket.off("startCall", handleStartCall);
    };
  }, [socket, startCall]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleMediaState = ({ audioEnabled, videoEnabled }) => {
      setRemoteCameraEnabled(videoEnabled);

      const peerConnection = peerConnectionRef.current;

      if (!peerConnection) {
        return;
      }

      peerConnection.getReceivers().forEach((receiver) => {
        if (!receiver.track) {
          return;
        }

        if (receiver.track.kind === "audio") {
          receiver.track.enabled = audioEnabled;
        }

        if (receiver.track.kind === "video") {
          receiver.track.enabled = videoEnabled;
        }
      });
    };

    socket.on("mediaState", handleMediaState);

    return () => {
      socket.off("mediaState", handleMediaState);
    };
  }, [socket]);

  useEffect(() => {
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      pendingCandidatesRef.current = [];
      pendingOfferRef.current = null;
    };
  }, []);

  const toggleMic = () => {
    if (!streamRef.current) {
      return;
    }

    const audioTrack = streamRef.current.getAudioTracks()[0];

    if (!audioTrack) {
      return;
    }

    const enabled = !audioTrack.enabled;

    audioTrack.enabled = enabled;

    setMicEnabled(enabled);

    socket.emit("mediaState", {
      roomId,
      audioEnabled: enabled,
      videoEnabled: cameraEnabled,
    });
  };

  const toggleCamera = () => {
    if (!streamRef.current) {
      return;
    }

    const videoTrack = streamRef.current.getVideoTracks()[0];

    if (!videoTrack) {
      return;
    }

    const enabled = !videoTrack.enabled;

    videoTrack.enabled = enabled;

    setCameraEnabled(enabled);

    socket.emit("mediaState", {
      roomId,
      audioEnabled: micEnabled,
      videoEnabled: enabled,
    });
  };

  return (
    <div className="video-call">
      <div className="video-call-header">
        <span>Room Call</span>
      </div>

      <div className="video-area">
        <video
          ref={remoteVideoRef}
          className={`remote-video ${!remoteCameraEnabled ? "camera-off" : ""}`}
          autoPlay
          playsInline
        />

        {!remoteCameraEnabled && (
          <div className="remote-camera-off">
            <div className="remote-camera-icon">🚫</div>
            <span>Camera Off</span>
          </div>
        )}

        <video
          ref={localVideoRef}
          className={`local-video ${!cameraEnabled ? "camera-off" : ""}`}
          autoPlay
          muted
          playsInline
        />

        {!cameraEnabled && (
          <div className="local-camera-off">
            <span>Camera Off</span>
          </div>
        )}
      </div>

      <div className="call-controls">
        <button
          className={`call-control ${!micEnabled ? "control-off" : ""}`}
          onClick={toggleMic}
          title={micEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          <span className="control-icon">🎤</span>
          {!micEnabled && <span className="control-slash">/</span>}
        </button>

        <button
          className={`call-control ${!cameraEnabled ? "control-off" : ""}`}
          onClick={toggleCamera}
          title={cameraEnabled ? "Turn camera off" : "Turn camera on"}
        >
          <span className="control-icon">📹</span>
          {!cameraEnabled && <span className="control-slash">/</span>}
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
