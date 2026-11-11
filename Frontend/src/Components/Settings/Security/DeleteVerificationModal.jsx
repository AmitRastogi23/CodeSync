import "./DeleteVerificationModal.css";

const DeleteVerificationModal = ({
  isOpen,
  type,
  code,
  setCode,
  error,
  isLoading,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="dvm-overlay">
      <div className="dvm-content">
        <h2>{type === "2FA" ? "Enter 2FA Code" : "Enter OTP"}</h2>
        <p className="dvm-desc">
          {type === "2FA"
            ? "Please enter the 6-digit code from your Authenticator app to confirm account deletion."
            : "We have sent a 6-digit OTP to your email. Please enter it below to confirm account deletion."}
        </p>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          maxLength="6"
          className="dvm-input"
          autoFocus
        />

        {error && <p className="dvm-error">{error}</p>}

        <div className="dvm-actions">
          <button
            type="button"
            className="dvm-btn-text"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="dvm-btn-danger"
            onClick={onConfirm}
            disabled={isLoading || !code}
          >
            {isLoading ? "Verifying..." : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteVerificationModal;
