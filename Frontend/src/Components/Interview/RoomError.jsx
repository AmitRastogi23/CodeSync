import { useNavigate } from "react-router-dom";
import "./RoomError.css";

const RoomError = ({ title, message }) => {
  const navigate = useNavigate();

  return (
    <div className="re-wrapper">
      <section className="re-page">
        <div className="re-container">
          <div className="re-bg-shape"></div>
          <svg className="re-deco-strokes" viewBox="0 0 40 40" fill="none">
            <path
              d="M8 32 L 14 12"
              stroke="#C6F432"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M18 34 L 24 14"
              stroke="#C6F432"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M28 36 L 34 16"
              stroke="#C6F432"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          <div className="re-card">
            <div className="re-icon-wrapper">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h1 className="re-title">{title}</h1>
            <p className="re-message">{message}</p>
            <button className="re-btn" onClick={() => navigate("/")}>
              Go Back to Home
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RoomError;
