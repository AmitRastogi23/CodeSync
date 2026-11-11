import { useState, useEffect } from "react";
import "./TwoFactorModal.css";

const TwoFactorModal = ({ isOpen, onClose, qrCodeUrl, secret, onVerify }) => {
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
      await onVerify(token);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code");
      setIsLoading(false);
    }
  };

  return (
    <div className="tfm-overlay">
      <div className="tfm-content">
        <h2>Enable Two-Factor Authentication</h2>
        <p>
          Scan this QR code with your Authenticator app (like Google
          Authenticator).
        </p>

        {qrCodeUrl && (
          <div className="tfm-qr-wrapper">
            <img src={qrCodeUrl} alt="2FA QR Code" />
          </div>
        )}

        {secret && (
          <div className="tfm-manual-secret">
            <p>Can't scan the QR code? Enter this key manually:</p>
            <code>{secret}</code>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="tfm-form-group">
            <label>Enter 6-digit code from app</label>
            <input
              type="text"
              placeholder="123456"
              maxLength="6"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>

          {error && <p className="tfm-error">{error}</p>}

          <div className="tfm-actions">
            <button
              type="button"
              className="tfm-btn-text"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tfm-btn-primary"
              disabled={isLoading || !qrCodeUrl}
            >
              {isLoading ? "Verifying..." : "Verify & Enable"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorModal;
