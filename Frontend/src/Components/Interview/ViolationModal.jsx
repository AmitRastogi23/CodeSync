import { useEffect } from "react";
import "./ViolationModal.css";

const ViolationModal = ({ isOpen, type, onReEnterFullscreen }) => {
  // Escape se band nahi hoga — candidate ko fullscreen wapas aana padega
  useEffect(() => {
    if (!isOpen) return;
    const blockKey = (e) => {
      if (e.key === "Escape") e.preventDefault();
    };
    window.addEventListener("keydown", blockKey);
    return () => window.removeEventListener("keydown", blockKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const getMessage = () => {
    if (type === "fullscreen_exit") {
      return "You exited fullscreen mode. Please re-enter fullscreen to continue the interview.";
    }
    if (type === "tab_switch") {
      return "You switched tabs. This action has been reported to the interviewer. Please re-enter fullscreen.";
    }
    if (type === "window_blur") {
      return "You left the window. This action has been reported to the interviewer. Please re-enter fullscreen.";
    }
    return "You are not allowed to leave the full screen mode.";
  };

  return (
    <div className="vm-overlay">
      <div className="vm-modal">
        <div className="vm-icon">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h2 className="vm-title">Warning</h2>
        <p className="vm-message">{getMessage()}</p>
        <button className="vm-btn" onClick={onReEnterFullscreen}>
          Re-enter Fullscreen
        </button>
      </div>
    </div>
  );
};

export default ViolationModal;
