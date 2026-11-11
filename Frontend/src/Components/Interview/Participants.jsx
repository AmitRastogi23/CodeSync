import { useEffect } from "react";
import "./Participants.css";

const ParticipantsModal = ({
  isOpen,
  onClose,
  waitingList,
  inRoomList,
  currentUserEmail,
  role,
  onAdmit,
}) => {
  // Escape key se close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isInterviewer = role === "interviewer";

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pm-header">
          <h2 className="pm-title">Participants</h2>
          <button className="pm-close-btn" onClick={onClose} title="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Waiting Room Section */}
        <div className="pm-section">
          <div className="pm-section-header">
            <h3 className="pm-section-title">Waiting Room</h3>
            <span className="pm-count">{waitingList.length}</span>
          </div>

          {waitingList.length === 0 ? (
            <p className="pm-empty">No one is waiting.</p>
          ) : (
            <ul className="pm-list">
              {waitingList.map((p) => (
                <li key={p.email} className="pm-item">
                  <div className="pm-item-left">
                    <div className="pm-avatar">
                      {(p.name || "?")[0].toUpperCase()}
                    </div>
                    <span className="pm-name">{p.name}</span>
                  </div>

                  {isInterviewer && (
                    <button
                      className="pm-admit-btn"
                      onClick={() => onAdmit(p.email)}
                    >
                      Admit
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* In Room Section */}
        <div className="pm-section">
          <div className="pm-section-header">
            <h3 className="pm-section-title">In Room</h3>
            <span className="pm-count">{inRoomList.length}</span>
          </div>

          {inRoomList.length === 0 ? (
            <p className="pm-empty">No one is in the room yet.</p>
          ) : (
            <ul className="pm-list">
              {inRoomList.map((p) => (
                <li key={p.email} className="pm-item">
                  <div className="pm-item-left">
                    <div className="pm-avatar">
                      {(p.name || "?")[0].toUpperCase()}
                    </div>
                    <span className="pm-name">
                      {p.name}
                      {p.email === currentUserEmail && (
                        <span className="pm-you"> (You)</span>
                      )}
                    </span>
                  </div>

                  <span className="pm-role-badge">
                    {p.role === "interviewer" ? "Interviewer" : "Candidate"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantsModal;
