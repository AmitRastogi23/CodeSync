import { useState } from "react";
import "./ShareQuestionsModal.css";

const ShareQuestionsModal = ({ isOpen, onClose, myQuestions, onShare }) => {
  const [email, setEmail] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Dropdown se question add karna
  const handleQuestionSelect = (e) => {
    const questionId = e.target.value;
    if (questionId && !selectedQuestions.includes(questionId)) {
      setSelectedQuestions([...selectedQuestions, questionId]);
    }
  };

  // Selected list se remove karna
  const removeQuestion = (id) => {
    setSelectedQuestions(selectedQuestions.filter((qId) => qId !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      return setError("Please enter a valid email address.");
    }
    if (selectedQuestions.length === 0) {
      return setError("Please select at least one question to share.");
    }

    setIsLoading(true);
    try {
      await onShare({ email, questionIds: selectedQuestions });
      setEmail("");
      setSelectedQuestions([]);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to share questions.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sm-overlay">
      <div className="sm-container">
        <div className="sm-header">
          <h2>Share Questions</h2>
          <button type="button" className="sm-close" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="sm-form">
          <div className="sm-body">
            {error && <div className="sm-error">{error}</div>}

            {/* Email Input */}
            <div className="sm-group">
              <label>Share with (Email Address)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., colleague@example.com"
                required
              />
              <small className="sm-hint">
                They will get view-only access to the selected questions.
              </small>
            </div>

            {/* Questions Dropdown */}
            <div className="sm-group">
              <label>Select Questions</label>
              <select onChange={handleQuestionSelect} value="">
                <option value="" disabled>
                  Select a question to share...
                </option>
                {myQuestions.map((q, idx) => (
                  <option key={q._id} value={q._id}>
                    Q{idx + 1}: {q.title} ({q.difficulty})
                  </option>
                ))}
              </select>

              {/* Selected Questions List */}
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
              {isLoading ? "Sharing..." : "Share Questions"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareQuestionsModal;
