import { useEffect, useRef } from "react";
import useWebRTC from "./useWebRTC";
import "./InterviewVideoPanel.css";

const InterviewVideoPanel = ({ socket, roomId }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const {
    localStream,
    remoteStream,
    micEnabled,
    cameraEnabled,
    remoteCameraEnabled,
    mediaError,
    toggleMic,
    toggleCamera,
  } = useWebRTC({ socket, roomId });

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    const el = remoteVideoRef.current;
    if (!el) return;
    el.srcObject = remoteStream; // null => element clears to black
    if (remoteStream) el.play().catch(() => {});
  }, [remoteStream]);

  const hideRemoteVideo = !remoteStream || !remoteCameraEnabled;

  return (
    <div className="ivp-container">
      {/* Remote (top) */}
      <div className="ivp-remote-wrapper">
        <video
          ref={remoteVideoRef}
          className={`ivp-remote-video ${hideRemoteVideo ? "camera-off" : ""}`}
          autoPlay
          playsInline
        />
        {!remoteStream && (
          <div className="ivp-camera-off ivp-waiting">
            <i className="fa-solid fa-user"></i>
            <span>Waiting for participant…</span>
          </div>
        )}
        {remoteStream && !remoteCameraEnabled && (
          <div className="ivp-camera-off">
            <i className="fa-solid fa-video-slash"></i>
            <span>Camera Off</span>
          </div>
        )}
      </div>

      {/* Local (bottom) */}
      <div className="ivp-local-wrapper">
        <video
          ref={localVideoRef}
          className={`ivp-local-video ${!cameraEnabled ? "camera-off" : ""}`}
          autoPlay
          muted
          playsInline
        />
        {mediaError && (
          <div className="ivp-camera-off">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>Camera/microphone unavailable</span>
          </div>
        )}
        {!mediaError && !cameraEnabled && (
          <div className="ivp-camera-off">
            <i className="fa-solid fa-video-slash"></i>
          </div>
        )}

        <div className="ivp-controls">
          <button
            className={`ivp-btn ${!micEnabled ? "off" : ""}`}
            onClick={toggleMic}
            disabled={!localStream}
            aria-label={micEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            <i
              className={`fa-solid ${micEnabled ? "fa-microphone" : "fa-microphone-slash"}`}
            ></i>
          </button>
          <button
            className={`ivp-btn ${!cameraEnabled ? "off" : ""}`}
            onClick={toggleCamera}
            disabled={!localStream}
            aria-label={cameraEnabled ? "Turn camera off" : "Turn camera on"}
          >
            <i
              className={`fa-solid ${cameraEnabled ? "fa-video" : "fa-video-slash"}`}
            ></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewVideoPanel;
