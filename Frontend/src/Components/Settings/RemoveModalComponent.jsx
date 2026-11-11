import "./RemoveModalComponent.css"; 

const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{ maxWidth: "400px", textAlign: "center" }}
      >
        <h2>{title}</h2>
        <p>{message}</p>

        <div
          className="modal-actions"
          style={{ justifyContent: "center", marginTop: "24px" }}
        >
          <button
            type="button"
            className="btn-text"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Removing..." : "Yes, Remove"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
