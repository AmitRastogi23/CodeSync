import { useEffect } from "react";
import "./Toast.css";

const Toast = ({
  isVisible,
  message,
  onClose,
  duration = 4000,
  type = "error",
}) => {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  // Type ke hisaab se icon aur color class set karo
  const getToastConfig = () => {
    switch (type) {
      case "success":
        return { icon: "fa-circle-check", className: "toast-success" };
      case "warning":
        return { icon: "fa-triangle-exclamation", className: "toast-warning" };
      case "error":
      default:
        return { icon: "fa-circle-exclamation", className: "toast-error" };
    }
  };

  const config = getToastConfig();

  return (
    <div className={`toast-container ${config.className}`}>
      <div className="toast">
        <div className="toast-icon">
          <i className={`fa-solid ${config.icon}`}></i>
        </div>
        <div className="toast-message">{message}</div>
        <button className="toast-close" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  );
};

export default Toast;
