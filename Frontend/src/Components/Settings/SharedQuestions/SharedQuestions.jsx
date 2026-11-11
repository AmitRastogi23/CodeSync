import { useState, useEffect } from "react";
import api from "../../../api/axios";
import "../MyQuestions/MyQuestions.css";
import QuestionDetails from "../MyQuestions/QuestionDetails";

const SharedQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    const fetchSharedQuestions = async () => {
      try {
        const res = await api.get("/questions/shared");
        setQuestions(res.data.questions);
      } catch (err) {
        console.error("Failed to fetch shared questions", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSharedQuestions();
  }, []);

  const handleRowClick = (question) => {
    setSelectedQuestion(question);
    setIsPanelOpen(true);
  };

  const getDifficultyClass = (difficulty) => {
    if (difficulty === "Easy") return "mq-badge-easy";
    if (difficulty === "Medium") return "mq-badge-medium";
    return "mq-badge-hard";
  };

  return (
    <div className="mq-tab">
      <div className="mq-page-header">
        <div>
          <h1 className="mq-page-title">Shared With Me</h1>
          <p className="mq-breadcrumb">Settings / Shared Questions</p>
        </div>
      </div>

      <div className="mq-card">
        {isLoading ? (
          <div className="mq-empty-state">Loading shared questions...</div>
        ) : questions.length === 0 ? (
          <div className="mq-empty-state">
            <p>No questions have been shared with you yet.</p>
            <p>
              When someone shares a question using your email, it will appear
              here.
            </p>
          </div>
        ) : (
          <table className="mq-table">
            <thead>
              <tr>
                <th width="50">S.No</th>
                <th>Title</th>
                <th width="120">Difficulty</th>
                <th width="200">Shared By</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, index) => (
                <tr
                  key={q._id}
                  onClick={() => handleRowClick(q)}
                  style={{ cursor: "pointer" }}
                >
                  <td className="mq-text-muted">{index + 1}</td>
                  <td>
                    <div className="mq-q-title">{q.title}</div>
                  </td>
                  <td>
                    <span
                      className={`mq-badge ${getDifficultyClass(q.difficulty)}`}
                    >
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="mq-text-muted">
                    {q.createdBy?.name || "Unknown"}
                    <br />
                    <span style={{ fontSize: "11px", opacity: 0.7 }}>
                      {q.createdBy?.email}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Question Details Panel (View Only) */}
      <QuestionDetails
        question={selectedQuestion}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </div>
  );
};

export default SharedQuestions;
