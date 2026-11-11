import { useState, useEffect } from "react";
import "./MyQuestions.css";
import QuestionModal from "./QuestionModal";
import api from "../../../api/axios";
import ConfirmModal from "../RemoveModalComponent";
import QuestionDetails from "./QuestionDetails";
import ShareQuestionsModal from "./ShareQuestionsModal";

const MyQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [questionToArchive, setQuestionToArchive] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const [editingQuestion, setEditingQuestion] = useState(null);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get("/questions/my");
        setQuestions(res.data.questions);
      } catch (err) {
        console.error("Failed to fetch questions", err);
      }
    };
    fetchQuestions();
  }, []);

  // Archive button click hone pe
  const handleArchiveClick = (question) => {
    setQuestionToArchive(question);
    setIsArchiveModalOpen(true);
  };

  // Modal me "Yes" dabane pe
  const confirmArchive = async () => {
    if (!questionToArchive) return;

    setIsArchiving(true);
    try {
      await api.delete(`/questions/${questionToArchive._id}`);
      // Local state update
      setQuestions(questions.filter((q) => q._id !== questionToArchive._id));
      setIsArchiveModalOpen(false);
    } catch (err) {
      console.log(err || "Failed to Archive Question");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleEditClick = (question) => {
    setEditingQuestion(question);
    setIsModalOpen(true);
  };

  const handleSubmitQuestion = async (formData) => {
    if (editingQuestion) {
      const res = await api.patch(
        `/questions/${editingQuestion._id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      setQuestions(
        questions.map((q) =>
          q._id === editingQuestion._id ? res.data.question : q,
        ),
      );
    } else {
      const res = await api.post("/questions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setQuestions([res.data.question, ...questions]);
    }
    setEditingQuestion(null);
  };

  const handleRowClick = (question) => {
    setSelectedQuestion(question);
    setIsPanelOpen(true);
  };

  const handleShareQuestions = async (payload) => {
    await api.post("/questions/share", payload);
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
          <h1 className="mq-page-title">My Questions</h1>
          <p className="mq-breadcrumb">Settings / My Questions</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="mq-btn-primary"
            style={{
              background: "#FFFFFF",
              color: "#0A0A0B",
              border: "1px solid #E5E5E5",
            }}
            onClick={() => setIsShareModalOpen(true)}
          >
            <i className="fa-solid fa-share-nodes"></i> Share Questions
          </button>
          <button
            className="mq-btn-primary"
            onClick={() => {
              setEditingQuestion(null);
              setIsModalOpen(true);
            }}
          >
            <i className="fa-solid fa-plus"></i> Add New Question
          </button>
        </div>
      </div>

      <div className="mq-card">
        {questions.length === 0 ? (
          <div className="mq-empty-state">
            <p>You haven't created any questions yet.</p>
            <p>Click "+ Add New Question" to get started.</p>
          </div>
        ) : (
          <table className="mq-table">
            <thead>
              <tr>
                <th width="50">S.No</th>
                <th>Title</th>
                <th width="120">Difficulty</th>
                <th width="180">Actions</th>
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
                  <td>
                    <div className="mq-action-buttons">
                      <button
                        className="mq-btn-action edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(q);
                        }}
                      >
                        <i className="fa-solid fa-pen-to-square"></i> Edit
                      </button>

                      <button
                        className="mq-btn-action archive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveClick(q);
                        }}
                      >
                        <i className="fa-solid fa-box-archive"></i> Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <QuestionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingQuestion(null);
        }}
        onSubmit={handleSubmitQuestion}
        initialData={editingQuestion}
      />

      {/* Archive Confirmation Modal */}
      <ConfirmModal
        isOpen={isArchiveModalOpen}
        title="Archive Question?"
        message={`Are you sure you want to archive "${questionToArchive?.title}"? It will be hidden from your library, but previous interviews using it will not be affected.`}
        onConfirm={confirmArchive}
        onCancel={() => setIsArchiveModalOpen(false)}
        isLoading={isArchiving}
      />

      <QuestionDetails
        question={selectedQuestion}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />

      <ShareQuestionsModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        myQuestions={questions}
        onShare={handleShareQuestions}
      />
    </div>
  );
};

export default MyQuestions;
