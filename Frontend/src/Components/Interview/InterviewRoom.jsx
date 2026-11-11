import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "./InterviewRoom.css";

import Navbar from "../Navbar/Navbar";
import RoomError from "./RoomError";
import InterviewQuestionPanel from "./InterviewQuestionPanel";
import EditorWorkspace from "./EditorWorkspace";
import InterviewVideoPanel from "./InterviewVideoPanel";
import Chat from "./Chat";
import Whiteboard from "./Whiteboard";
import ParticipantsModal from "./Participants";
import ConfirmModal from "./ConfirmModal";
import ViolationModal from "./ViolationModal";
import Toast from "../Toast";
import NotesPopup from "./NotesPopup";

import socket from "../../socket";

const InterviewRoom = () => {
  const { user } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState(null);
  const [role, setRole] = useState(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [language, setLanguage] = useState("javascript");

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState(null);

  // Notes State
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // chat modal states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isChatOpenRef = useRef(isChatOpen);

  // participants modal state
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [waitingList, setWaitingList] = useState([]);
  const [inRoomList, setInRoomList] = useState([]);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // layout modal states
  const [layoutMode, setLayoutMode] = useState("code");
  const changeQuestionRef = useRef(null);
  const layoutMetaRef = useRef(null);

  // violation + toast states
  const [violationType, setViolationType] = useState(null);
  const [isViolationOpen, setIsViolationOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const lastViolationRef = useRef(0);

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const infoRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (infoRef.current && !infoRef.current.contains(e.target)) {
        setIsInfoOpen(false);
      }
    };
    if (isInfoOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isInfoOpen]);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  // 0. Candidate Violation Detection
  useEffect(() => {
    if (role !== "candidate") return;

    const triggerViolation = (type) => {
      const now = Date.now();
      // Debounce: 1 sec ke andar dobara fire ho toh ignore
      if (now - lastViolationRef.current < 1000) return;
      lastViolationRef.current = now;

      setViolationType(type);
      setIsViolationOpen(true);
      socket.emit("candidateViolation", { roomId, type });
    };

    const handleFullscreenChange = () => {
      // Agar fullscreen se bahar aaya (andar nahi hai) toh violation
      if (!document.fullscreenElement) {
        triggerViolation("fullscreen_exit");
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation("tab_switch");
      }
    };

    const handleBlur = () => {
      triggerViolation("window_blur");
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [role, roomId]);

  // 1. Socket Join & Chat Listeners
  useEffect(() => {
    if (socket && roomId && user) {
      socket.emit("join", {
        roomId,
      });

      const handleJoinSuccess = () => setIsAuthorized(true);
      const handleJoinError = (payload) => {
        if (typeof payload === "string") {
          setError({ title: "Access Denied", message: payload });
        } else {
          setError(payload);
        }
      };
      const handleChatHistory = (history) => setMessages(history);

      const handleReceiveMessage = (msg) => {
        setMessages((prev) => [...prev, msg]);
        if (!isChatOpenRef.current && msg.userName !== user.name) {
          setUnreadCount((prev) => prev + 1);
        }
      };

      // participants lists updates
      const handleParticipantsUpdate = ({ waiting, inRoom }) => {
        setWaitingList(waiting || []);
        setInRoomList(inRoom || []);
        console.log("Participants update:", { waiting, inRoom });
      };

      // Admit error (e.g. unauthorized, candidate gone)
      const handleAdmitError = (payload) => {
        console.warn("Admit failed:", payload);
      };

      const handleReturnToWaiting = () => {
        navigate(`/join/${roomId}`);
      };

      const handleViolationAlert = (payload) => {
        setToastMessage(
          payload.message || "Candidate attempted a prohibited action",
        );
        setIsToastVisible(true);
      };

      socket.on("joinSuccess", handleJoinSuccess);
      socket.on("joinError", handleJoinError);
      socket.on("chatHistory", handleChatHistory);
      socket.on("receiveMessage", handleReceiveMessage);
      socket.on("participantsUpdate", handleParticipantsUpdate);
      socket.on("admitError", handleAdmitError);
      socket.on("returnToWaiting", handleReturnToWaiting);
      socket.on("violationAlert", handleViolationAlert);

      return () => {
        socket.off("joinSuccess", handleJoinSuccess);
        socket.off("joinError", handleJoinError);
        socket.off("chatHistory", handleChatHistory);
        socket.off("receiveMessage", handleReceiveMessage);
        socket.off("participantsUpdate", handleParticipantsUpdate);
        socket.off("admitError", handleAdmitError);
        socket.off("returnToWaiting", handleReturnToWaiting);
        socket.off("violationAlert", handleViolationAlert);
      };
    }
  }, [roomId, user.id, user, navigate]);

  // 2. Fetch Session Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/sessions/interview/${roomId}`);
        setSessionData(res.data.session);
        setRole(res.data.session.role);
      } catch (err) {
        setError({
          title: err.response?.data?.title || "Something Went Wrong",
          message:
            err.response?.data?.message ||
            "We couldn't load this interview. Please try again.",
        });
      }
    };
    fetchData();
  }, [roomId]);

  // 3. Layout Sync (Yjs)
  useEffect(() => {
    if (!isAuthorized) return;

    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      import.meta.env.VITE_YJS_URL,
      roomId,
      ydoc,
    );
    const metaMap = ydoc.getMap("meta");
    layoutMetaRef.current = metaMap;

    if (!metaMap.has("layoutMode")) {
      metaMap.set("layoutMode", "code");
    }
    const updateLayout = () => {
      setLayoutMode(metaMap.get("layoutMode") || "code");
    };
    metaMap.observe(updateLayout);
    updateLayout();

    return () => {
      metaMap.unobserve(updateLayout);
      provider.destroy();
    };
  }, [roomId, isAuthorized]);

  if (error) {
    return (
      <div>
        <Navbar></Navbar>
        <RoomError title={error.title} message={error.message} />
      </div>
    );
  }

  if (!isAuthorized) {
    return <div className="ir-loading">Verifying access...</div>;
  }

  const questions = sessionData?.questions || [];
  const activeQuestion = questions[activeQuestionIndex];

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleQuestionClick = (idx) => {
    setActiveQuestionIndex(idx);
    if (changeQuestionRef.current) {
      changeQuestionRef.current(idx);
    }
  };

  const handleLayoutToggle = () => {
    const newMode = layoutMode === "code" ? "whiteboard" : "code";
    setLayoutMode(newMode);
    if (layoutMetaRef.current) {
      layoutMetaRef.current.set("layoutMode", newMode);
    }
  };

  const handleAdmit = (candidateEmail) => {
    socket.emit("admitCandidate", { roomId, candidateEmail });
  };

  const handleOpenParticipants = () => {
    setIsParticipantsOpen(true);
    socket.emit("requestParticipants", { roomId });
  };

  const handleEndSessionClick = () => {
    setIsConfirmOpen(true);
  };

  const handleLeaveRoomClick = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmEndSession = () => {
    setIsConfirmOpen(false);
    socket.emit("leaveRoom");
    navigate("/settings/sessions");
  };

  const handleConfirmLeaveRoom = () => {
    setIsConfirmOpen(false);
    socket.emit("leaveRoom");
    navigate("/");
  };

  const handleReEnterFullscreen = () => {
    document.documentElement.requestFullscreen().catch((err) => {
      console.log("Fullscreen error:", err);
    });
    setIsViolationOpen(false);
    setViolationType(null);
  };

  return (
    <div className="ir-container">
      <header className="ir-topbar">
        <div className="ir-topbar-left">
          <span className="ir-logo">
            Code<span>Sync</span>
          </span>

          <div className="ir-info-wrapper" ref={infoRef}>
            <button
              className="ir-icon-btn ir-info-btn"
              title="Room details"
              onClick={() => setIsInfoOpen(!isInfoOpen)}
            >
              <i className="fa-solid fa-circle-info"></i>
            </button>

            {isInfoOpen && sessionData && (
              <div className="ir-info-popover">
                <div className="ir-info-header">Room Details</div>
                <div className="ir-info-row">
                  <span className="ir-info-label">Interviewer</span>
                  <span className="ir-info-value">
                    {sessionData.interviewerName}
                  </span>
                </div>
                <div className="ir-info-row">
                  <span className="ir-info-label">Candidate</span>
                  <span className="ir-info-value">
                    {sessionData.candidateEmail}
                  </span>
                </div>
                <div className="ir-info-row">
                  <span className="ir-info-label">Scheduled At</span>
                  <span className="ir-info-value">
                    {sessionData.scheduledAt
                      ? new Date(sessionData.scheduledAt).toLocaleString()
                      : "Not scheduled"}
                  </span>
                </div>
                <div className="ir-info-row">
                  <span className="ir-info-label">Room ID</span>
                  <span className="ir-info-value ir-info-mono">{roomId}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="ir-topbar-center">
          <button
            className="ir-icon-btn chat-icon-btn"
            title="Toggle Chat"
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              setUnreadCount(0);
            }}
          >
            <i className="fa-solid fa-comment-dots"></i>
            {unreadCount > 0 && (
              <span className="chat-badge">{unreadCount}</span>
            )}
          </button>

          <button
            className="ir-icon-btn"
            title="View Participants"
            onClick={handleOpenParticipants}
          >
            <i className="fa-solid fa-users"></i>
            {waitingList.length > 0 && role === "interviewer" && (
              <span className="ir-participants-badge">
                {waitingList.length}
              </span>
            )}
          </button>

          {role === "interviewer" && (
            <button
              className="ir-icon-btn"
              title="Interview Notes"
              onClick={() => setIsNotesOpen(!isNotesOpen)}
            >
              <i className="fa-solid fa-note-sticky"></i>
            </button>
          )}

          <button
            className="ir-icon-btn"
            title={
              layoutMode === "code" ? "Switch to Whiteboard" : "Switch to Code"
            }
            onClick={handleLayoutToggle}
          >
            <i
              className={`fa-solid ${layoutMode === "code" ? "fa-pen-ruler" : "fa-code"}`}
            ></i>
          </button>
        </div>

        <div className="ir-topbar-right">
          <button
            className="ir-icon-btn"
            title="Toggle Video"
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          >
            <i className="fa-solid fa-video"></i>
          </button>

          <button
            className="ir-icon-btn"
            title="Toggle Fullscreen"
            onClick={toggleFullScreen}
          >
            <i className="fa-solid fa-expand"></i>
          </button>

          {role === "interviewer" ? (
            <button className="ir-end-btn" onClick={handleEndSessionClick}>
              End Session
            </button>
          ) : (
            <button className="ir-leave-btn" onClick={handleLeaveRoomClick}>
              Leave Room
            </button>
          )}
        </div>
      </header>

      <div className="ir-main-body">
        <div className="ir-left-area">
          {layoutMode === "code" ? (
            <>
              <div className="ir-thin-bar">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    className={`ir-q-num ${activeQuestionIndex === idx ? "active" : ""}`}
                    onClick={() => handleQuestionClick(idx)}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <InterviewQuestionPanel question={activeQuestion} />

              <div className="ir-editor-area">
                <EditorWorkspace
                  roomId={roomId}
                  socket={socket}
                  language={language}
                  setLanguage={setLanguage}
                  questionId={activeQuestion?._id}
                  setActiveQuestionIndex={setActiveQuestionIndex}
                  changeQuestionRef={changeQuestionRef}
                />
              </div>
            </>
          ) : (
            <div className="ir-whiteboard-area">
              <Whiteboard roomId={roomId} userName={user?.name} />
            </div>
          )}
        </div>

        <div
          className="ir-right-panel"
          style={{
            display: isRightPanelOpen ? "block" : "none",
            height: "100%",
          }}
        >
          <InterviewVideoPanel socket={socket} roomId={roomId} />
        </div>
      </div>

      {isChatOpen && (
        <Chat
          socket={socket}
          roomId={roomId}
          userName={user?.name}
          messages={messages}
          onClose={() => setIsChatOpen(false)}
        />
      )}

      {isParticipantsOpen && (
        <ParticipantsModal
          isOpen={isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
          waitingList={waitingList}
          inRoomList={inRoomList}
          currentUserEmail={user?.email}
          role={role}
          onAdmit={handleAdmit}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title={role === "interviewer" ? "End Session?" : "Leave Room?"}
        message={
          role === "interviewer"
            ? "Are you sure you want to end the session? It will be marked as complete."
            : "Are you sure you want to leave the room? You will need to be admitted by the interviewer again."
        }
        confirmText={role === "interviewer" ? "End Session" : "Leave Room"}
        cancelText="Cancel"
        isDanger={true}
        onConfirm={
          role === "interviewer"
            ? handleConfirmEndSession
            : handleConfirmLeaveRoom
        }
        onCancel={() => setIsConfirmOpen(false)}
      />

      <ViolationModal
        isOpen={isViolationOpen}
        type={violationType}
        onReEnterFullscreen={handleReEnterFullscreen}
      />

      <Toast
        isVisible={isToastVisible}
        message={toastMessage}
        type="error"
        onClose={() => setIsToastVisible(false)}
      />

      {role === "interviewer" && (
        <NotesPopup
          isOpen={isNotesOpen}
          onClose={() => setIsNotesOpen(false)}
          roomId={roomId}
        />
      )}
    </div>
  );
};

export default InterviewRoom;
