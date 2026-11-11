import { useState, useEffect } from "react";
import "./Disable2FAModal.css";

const Disable2FAModal = ({ isOpen, onClose, onDisable }) => {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken("");
      setError("");
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await onDisable(token);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code");
      setIsLoading(false);
    }
  };

  return (
    <div className="dtm-overlay">
      <div className="dtm-content">
        <h2>Disable Two-Factor Authentication</h2>
        <p>
          To disable 2FA, please enter the 6-digit code from your Authenticator
          app.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="dtm-form-group">
            <label>Enter 6-digit code</label>
            <input
              type="text"
              placeholder="123456"
              maxLength="6"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              autoFocus
            />
          </div>

          {error && <p className="dtm-error">{error}</p>}

          <div className="dtm-actions">
            <button
              type="button"
              className="dtm-btn-text"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="dtm-btn-danger"
              disabled={isLoading || !token}
            >
              {isLoading ? "Disabling..." : "Disable 2FA"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Disable2FAModal;
