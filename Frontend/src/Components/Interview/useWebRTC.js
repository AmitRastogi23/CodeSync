import { useState, useEffect, useCallback } from "react";

const RTC_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  // For production add a TURN server, otherwise some networks can't connect.
};

export default function useWebRTC({ socket, roomId }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [remoteCameraEnabled, setRemoteCameraEnabled] = useState(true);
  const [mediaError, setMediaError] = useState(null);

  // ---- 1. Acquire camera/mic ----
  useEffect(() => {
    let cancelled = false;
    let acquired = null;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop()); // unmounted while prompting
          return;
        }
        acquired = stream;
        setLocalStream(stream);
      })
      .catch((err) => {
        if (!cancelled) setMediaError(err);
      });

    return () => {
      cancelled = true;
      acquired?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Tell the peer our current mic/camera state (read from the real tracks,
  // so there are no stale-closure bugs).
  const sendMediaState = useCallback(() => {
    if (!socket || !localStream) return;
    socket.emit("mediaState", {
      roomId,
      audioEnabled: localStream.getAudioTracks()[0]?.enabled ?? false,
      videoEnabled: localStream.getVideoTracks()[0]?.enabled ?? false,
    });
  }, [socket, roomId, localStream]);

  // ---- 2. Signaling + peer connection lifecycle ----
  useEffect(() => {
    if (!socket || !localStream) return;

    let pc = null;
    let pendingCandidates = [];
    let makingOffer = false;

    const disposePeer = () => {
      if (!pc) return;
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
      pc = null;
    };

    const resetRemote = () => {
      setRemoteStream(null); // video element goes back to black
      setRemoteCameraEnabled(true);
    };

    const closePeer = () => {
      disposePeer();
      pendingCandidates = [];
      resetRemote();
    };

    // Always start from a fresh connection for every new negotiation.
    const createPeer = () => {
      disposePeer();
      resetRemote();

      const peer = new RTCPeerConnection(RTC_CONFIG);
      pc = peer;

      localStream.getTracks().forEach((t) => peer.addTrack(t, localStream));

      peer.onicecandidate = ({ candidate }) => {
        if (candidate && pc === peer) {
          socket.emit("iceCandidate", { roomId, candidate });
        }
      };

      peer.ontrack = ({ streams: [stream] }) => {
        if (stream && pc === peer) setRemoteStream(stream);
      };

      peer.onconnectionstatechange = () => {
        if (pc !== peer) return;
        if (peer.connectionState === "connected") {
          sendMediaState(); // sync camera-off overlay
        } else if (peer.connectionState === "failed") {
          closePeer();
          socket.emit("videoReady", { roomId }); // ask peer to retry
        }
      };

      return peer;
    };

    const flushCandidates = async (peer) => {
      const queued = pendingCandidates;
      pendingCandidates = [];
      for (const c of queued) {
        try {
          await peer.addIceCandidate(c);
        } catch (err) {
          console.warn("addIceCandidate failed:", err);
        }
      }
    };

    const sendOffer = async () => {
      const peer = createPeer();
      try {
        makingOffer = true;
        await peer.setLocalDescription(await peer.createOffer());
        if (pc !== peer) return; // superseded meanwhile
        socket.emit("callOffer", { roomId, offer: peer.localDescription });
      } catch (err) {
        console.error("Failed to create offer:", err);
      } finally {
        makingOffer = false;
      }
    };

    // ---- socket handlers ----
    const onPeerReady = () => sendOffer();

    const onOffer = async ({ offer, from }) => {
      // Glare handling: if both sides offered at once, the peer with the
      // smaller socket id yields ("polite"); the other ignores the offer.
      const polite = socket.id < from;
      const collision =
        makingOffer || pc?.signalingState === "have-local-offer";
      if (collision && !polite) return;

      const peer = createPeer();
      try {
        await peer.setRemoteDescription(offer);
        await flushCandidates(peer);
        await peer.setLocalDescription(await peer.createAnswer());
        if (pc !== peer) return;
        socket.emit("callAnswer", { roomId, answer: peer.localDescription });
      } catch (err) {
        console.error("Failed to handle offer:", err);
      }
    };

    const onAnswer = async ({ answer }) => {
      const peer = pc;
      if (!peer || peer.signalingState !== "have-local-offer") return;
      try {
        await peer.setRemoteDescription(answer);
        await flushCandidates(peer);
      } catch (err) {
        console.error("Failed to handle answer:", err);
      }
    };

    const onIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      if (!pc || !pc.remoteDescription) {
        pendingCandidates.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.warn("addIceCandidate failed:", err);
      }
    };

    const onPeerLeft = () => closePeer();

    const onMediaState = ({ videoEnabled }) =>
      setRemoteCameraEnabled(videoEnabled);

    socket.on("peerReady", onPeerReady);
    socket.on("webrtcOffer", onOffer);
    socket.on("callAnswer", onAnswer);
    socket.on("iceCandidate", onIceCandidate);
    socket.on("peerLeft", onPeerLeft);
    socket.on("mediaState", onMediaState);

    // Handlers are registered, so it's now safe to announce we're ready.
    socket.emit("videoReady", { roomId });

    return () => {
      socket.off("peerReady", onPeerReady);
      socket.off("webrtcOffer", onOffer);
      socket.off("callAnswer", onAnswer);
      socket.off("iceCandidate", onIceCandidate);
      socket.off("peerLeft", onPeerLeft);
      socket.off("mediaState", onMediaState);
      socket.emit("videoStopped", { roomId }); // panel closed / unmounted
      closePeer();
    };
  }, [socket, roomId, localStream, sendMediaState]);

  // ---- 3. Controls ----
  const toggleMic = useCallback(() => {
    const track = localStream?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicEnabled(track.enabled);
    sendMediaState();
  }, [localStream, sendMediaState]);

  const toggleCamera = useCallback(() => {
    const track = localStream?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraEnabled(track.enabled);
    sendMediaState();
  }, [localStream, sendMediaState]);

  return {
    localStream,
    remoteStream,
    micEnabled,
    cameraEnabled,
    remoteCameraEnabled,
    mediaError,
    toggleMic,
    toggleCamera,
  };
}
