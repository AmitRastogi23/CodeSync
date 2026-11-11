import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import RoomError from "./RoomError";
import "./StartInterview.css";

const StartInterview = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isFullscreenEnabled, setIsFullscreenEnabled] = useState(false);
  const [sessionData, setSessionData] = useState(null);

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // 👈 NAYA: Loading state

  // 1. Fetch Session Data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/sessions/start/${roomId}`);
        setSessionData(res.data.session);
      } catch (err) {
        setError({
          title: err.response?.data?.title || "Something Went Wrong",
          message:
            err.response?.data?.message ||
            "We couldn't load this interview. Please try again.",
        });
      } finally {
        setIsLoading(false); // 👈 NAYA: Loading complete
      }
    };
    fetchSession();
  }, [roomId]);

  // 2. Start Local Video — 👇 FIX: Sirf tab chalao jab authorized ho
  useEffect(() => {
    // Agar loading hai, error hai, ya session nahi mila -> Camera start mat karo
    if (isLoading || error || !sessionData) return;

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
  }, [isLoading, error, sessionData]); // 👈 Dependencies update

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

  // 4. Start Interview
  const handleStartInterview = () => {
    if (isFullscreenEnabled && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log("Fullscreen error:", err);
      });
    }

    stream?.getTracks().forEach((track) => track.stop());
    navigate(`/interview/${roomId}`);
  };

  const isReadyToStart = cameraEnabled && micEnabled && isFullscreenEnabled;

  // 👇 NAYA: Loading screen jab tak API check na ho
  if (isLoading) {
    return <div className="si-loading">Verifying access...</div>;
  }

  if (error) {
    return <RoomError title={error.title} message={error.message} />;
  }

  return (
    <div className="si-wrapper">
      <div className="si-page">
        <div className="si-container">
          <div className="si-video-section">
            <div className="si-video-wrapper">
              <video
                ref={videoRef}
                className={`si-video ${!cameraEnabled ? "camera-off" : ""}`}
                autoPlay
                muted
                playsInline
              />
              {!cameraEnabled && (
                <div className="si-camera-off">
                  <i className="fa-solid fa-video-slash"></i>
                  <span>Camera Off</span>
                </div>
              )}
            </div>

            <div className="si-controls">
              <button
                className={`si-control-btn ${!micEnabled ? "off" : ""}`}
                onClick={toggleMic}
              >
                <i
                  className={`fa-solid ${
                    micEnabled ? "fa-microphone" : "fa-microphone-slash"
                  }`}
                ></i>
              </button>
              <button
                className={`si-control-btn ${!cameraEnabled ? "off" : ""}`}
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

          <div className="si-details-section">
            <div className="si-card">
              <h2 className="si-title">Ready to Start?</h2>
              <p className="si-subtitle">
                Please check your audio and video settings before joining.
              </p>

              <div className="si-info-box">
                <div className="si-info-row">
                  <span className="si-label">Name</span>
                  <span className="si-value">{user?.name}</span>
                </div>
                <div className="si-info-row">
                  <span className="si-label">Email</span>
                  <span className="si-value">{user?.email}</span>
                </div>
                <div className="si-info-row">
                  <span className="si-label">Room ID</span>
                  <span className="si-value">{roomId}</span>
                </div>
                {sessionData && (
                  <div className="si-info-row">
                    <span className="si-label">Scheduled At</span>
                    <span className="si-value">
                      {new Date(sessionData.scheduledAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <label className="si-checkbox-label">
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
                />
                <span className="si-checkmark"></span>
                Enter Fullscreen
              </label>

              <button
                className="si-start-btn"
                onClick={handleStartInterview}
                disabled={!isReadyToStart}
              >
                Start Interview
                <i className="fa-solid fa-arrow-right"></i>
              </button>

              {!isReadyToStart && (
                <p className="si-hint">
                  Please enable camera, mic, and fullscreen to start.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartInterview;
