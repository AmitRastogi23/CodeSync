import { useState, useEffect } from "react";
import api from "../../api/axios";
import "./NotesPopup.css";

const NotesPopup = ({ isOpen, onClose, roomId }) => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    if (!isOpen || !roomId) return;

    const fetchNotes = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await api.get(`/sessions/${roomId}/notes`);
        setContent(res.data.note?.content || "");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load notes.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotes();
  }, [isOpen, roomId]);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSavedMessage("");
    try {
      await api.put(`/sessions/${roomId}/notes`, { content });
      setSavedMessage("Saved!");
      setTimeout(() => setSavedMessage(""), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save notes.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="np-window">
      <div className="np-header">
        <h3>Interview Notes</h3>
        <button className="np-close-btn" onClick={onClose} title="Close">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div className="np-body">
        {isLoading ? (
          <div className="np-loading">Loading notes...</div>
        ) : (
          <>
            <textarea
              className="np-textarea"
              placeholder="Write your notes about the candidate here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={10000}
            />
            <div className="np-char-count">{content.length} / 10000</div>
          </>
        )}

        {error && <div className="np-error">{error}</div>}
        {savedMessage && (
          <div className="np-success">
            <i className="fa-solid fa-check"></i>
            {savedMessage}
          </div>
        )}
      </div>

      <div className="np-footer">
        <button className="np-cancel-btn" onClick={onClose}>
          Close
        </button>
        <button
          className="np-save-btn"
          onClick={handleSave}
          disabled={isSaving || isLoading}
        >
          {isSaving ? "Saving..." : "Save Notes"}
        </button>
      </div>
    </div>
  );
};

export default NotesPopup;
