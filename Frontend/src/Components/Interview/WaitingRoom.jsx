import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import RoomError from "./RoomError";
import "./WaitingRoom.css";

import socket from "../../socket";

const WaitingRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isFullscreenEnabled, setIsFullscreenEnabled] = useState(false);
  const [session, setSession] = useState(null);

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isWaitingForAdmit, setIsWaitingForAdmit] = useState(false);

  // 1. Fetch Session Data + verify candidate identity
  useEffect(() => {
    const verifyRoom = async () => {
      try {
        const res = await api.get(`/sessions/join/${roomId}`);
        setSession(res.data.session);
      } catch (err) {
        setError({
          title: err.response?.data?.title || "Something Went Wrong",
          message:
            err.response?.data?.message ||
            "We couldn't verify this room. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    verifyRoom();
  }, [roomId]);

  // 2. Start Local Video — 👇 FIX: Sirf tab chalao jab session verified ho
  useEffect(() => {
    // Agar error hai, ya loading hai, ya session nahi mila -> Camera start mat karo
    if (error || isLoading || !session) return;

    const startVideo = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    };

    startVideo();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, isLoading, session]); // 👈 Dependencies update ki

  // use effect for handling admitCandidate socket call
  useEffect(() => {
    const handleAdmitted = () => {
      stream?.getTracks().forEach((track) => track.stop());
      navigate(`/interview/${roomId}`);
    };

    const handleWaitingError = (payload) => {
      setIsWaitingForAdmit(false);
      if (typeof payload === "string") {
        setError({ title: "Access Denied", message: payload });
      } else {
        setError(payload);
      }
    };

    socket.on("admitted", handleAdmitted);
    socket.on("waitingError", handleWaitingError);

    return () => {
      socket.off("admitted", handleAdmitted);
      socket.off("waitingError", handleWaitingError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // 3. Toggle Mic/Camera
  const toggleMic = () => {
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicEnabled(track.enabled);
    }
  };

  const toggleCamera = () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCameraEnabled(track.enabled);
    }
  };

  // 4. Enter Room
  const handleEnterRoom = () => {
    if (isFullscreenEnabled && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log("Fullscreen error:", err);
      });
    }

    socket.emit("candidateWaiting", { roomId });
    setIsWaitingForAdmit(true);
  };

  const isReadyToEnter = cameraEnabled && micEnabled && isFullscreenEnabled;

  // 👇 FIX: Jab tak API se session verify nahi hota, tab tak Loading dikhao
  if (isLoading) {
    return <div className="wr-loading">Verifying room...</div>;
  }

  if (error) {
    return <RoomError title={error.title} message={error.message} />;
  }

  return (
    <div className="wr-wrapper">
      <div className="wr-page">
        <div className="wr-container">
          <div className="wr-video-section">
            <div className="wr-video-wrapper">
              <video
                ref={videoRef}
                className={`wr-video ${!cameraEnabled ? "camera-off" : ""}`}
                autoPlay
                muted
                playsInline
              />
              {!cameraEnabled && (
                <div className="wr-camera-off">
                  <i className="fa-solid fa-video-slash"></i>
                  <span>Camera Off</span>
                </div>
              )}
            </div>

            <div className="wr-controls">
              <button
                className={`wr-control-btn ${!micEnabled ? "off" : ""}`}
                onClick={toggleMic}
              >
                <i
                  className={`fa-solid ${
                    micEnabled ? "fa-microphone" : "fa-microphone-slash"
                  }`}
                ></i>
              </button>
              <button
                className={`wr-control-btn ${!cameraEnabled ? "off" : ""}`}
                onClick={toggleCamera}
              >
                <i
                  className={`fa-solid ${
                    cameraEnabled ? "fa-video" : "fa-video-slash"
                  }`}
                ></i>
              </button>
            </div>
          </div>

          <div className="wr-details-section">
            <div className="wr-card">
              <h2 className="wr-title">Waiting for Interviewer</h2>
              <p className="wr-subtitle">
                The interviewer will admit you shortly. Please check your audio
                and video settings.
              </p>

              <div className="wr-info-box">
                <div className="wr-info-row">
                  <span className="wr-label">Interviewer</span>
                  <span className="wr-value">{session?.interviewerName}</span>
                </div>
                <div className="wr-info-row">
                  <span className="wr-label">Room ID</span>
                  <span className="wr-value">{roomId}</span>
                </div>
                <div className="wr-info-row">
                  <span className="wr-label">Candidate</span>
                  <span className="wr-value">{user?.name}</span>
                </div>
              </div>

              <label className="wr-checkbox-label">
                <input
                  type="checkbox"
                  checked={isFullscreenEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsFullscreenEnabled(checked);

                    if (checked) {
                      document.documentElement
                        .requestFullscreen()
                        .catch((err) => {
                          console.log("Fullscreen error:", err);
                        });
                    } else {
                      if (document.exitFullscreen) {
                        document.exitFullscreen();
                      }
                    }
                  }}
                  disabled={isWaitingForAdmit}
                />
                <span className="wr-checkmark"></span>
                Enter Fullscreen
              </label>

              {isWaitingForAdmit ? (
                <div className="wr-waiting-state">
                  <span className="wr-waiting-spinner"></span>
                  <span>Waiting for Interviewer to Admit You</span>
                </div>
              ) : (
                <button
                  className="wr-enter-btn"
                  onClick={handleEnterRoom}
                  disabled={!isReadyToEnter}
                >
                  Enter Room
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              )}

              {!isReadyToEnter && !isWaitingForAdmit && (
                <p className="wr-hint">
                  Please enable camera, mic, and fullscreen to continue.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;
