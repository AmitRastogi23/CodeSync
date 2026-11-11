import { useState, useEffect } from "react";
import api from "../../../api/axios";
import "./SessionModal.css";

// 👇 NAYA: helper — Date to datetime-local (local time)
const formatDateTimeLocal = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const SessionModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [candidateEmail, setCandidateEmail] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [myQuestions, setMyQuestions] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const now = new Date();
  const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCandidateEmail(initialData.candidateEmail || "");
        setScheduledAt(
          initialData.scheduledAt
            ? formatDateTimeLocal(initialData.scheduledAt)
            : "",
        );
        setSelectedQuestions(initialData.questions?.map((q) => q._id) || []);
      } else {
        setCandidateEmail("");
        setScheduledAt("");
        setSelectedQuestions([]);
      }
      setError("");

      const fetchQuestions = async () => {
        try {
          const res = await api.get("/questions/accessible");
          setMyQuestions(res.data.questions);
        } catch (err) {
          console.error("Failed to fetch questions", err);
        }
      };
      fetchQuestions();
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleQuestionSelect = (e) => {
    const questionId = e.target.value;
    if (questionId && !selectedQuestions.includes(questionId)) {
      setSelectedQuestions([...selectedQuestions, questionId]);
    }
  };

  const removeQuestion = (id) => {
    setSelectedQuestions(selectedQuestions.filter((qId) => qId !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!candidateEmail || selectedQuestions.length === 0) {
      return setError(
        "Candidate email and at least one question are required.",
      );
    }

    if (scheduledAt && new Date(scheduledAt) < new Date()) {
      return setError("Scheduled time cannot be in the past.");
    }

    setIsLoading(true);
    try {
      const payload = {
        candidateEmail,
        questionIds: selectedQuestions,
        scheduledAt: scheduledAt || undefined,
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save session");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sm-overlay">
      <div className="sm-container">
        <div className="sm-header">
          <h2>{initialData ? "Edit Session" : "Create New Session"}</h2>
          <button type="button" className="sm-close" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="sm-form">
          <div className="sm-body">
            {error && <div className="sm-error">{error}</div>}

            <div className="sm-group">
              <label>Candidate Email</label>
              <input
                type="email"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                placeholder="e.g., candidate@example.com"
                disabled={!!initialData}
                required
              />
            </div>

            <div className="sm-group">
              <label>Scheduled Date & Time (Optional)</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={minDateTime}
              />
              <small className="sm-hint">
                Leave empty to start immediately.
              </small>
            </div>

            <div className="sm-group">
              <label>Select Questions</label>
              <select onChange={handleQuestionSelect} value="">
                <option value="" disabled>
                  Select a question to add...
                </option>
                {myQuestions.map((q) => (
                  <option key={q._id} value={q._id}>
                    {q.title} ({q.difficulty})
                  </option>
                ))}
              </select>

              {selectedQuestions.length > 0 && (
                <div className="sm-selected-questions">
                  {selectedQuestions.map((qId) => {
                    const q = myQuestions.find((item) => item._id === qId);
                    if (!q) return null;
                    return (
                      <div key={qId} className="sm-selected-item">
                        <span>{q.title}</span>
                        <button
                          type="button"
                          onClick={() => removeQuestion(qId)}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="sm-footer">
            <button
              type="button"
              className="sm-btn-text"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="sm-btn-primary"
              disabled={isLoading}
            >
              {isLoading
                ? initialData
                  ? "Updating..."
                  : "Creating..."
                : initialData
                  ? "Update Session"
                  : "Create Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionModal;
