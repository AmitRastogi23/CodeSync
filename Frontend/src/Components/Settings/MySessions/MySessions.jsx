import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MySessions.css";
import api from "../../../api/axios";
import SessionModal from "./SessionModal";
import ConfirmModal from "../RemoveModalComponent";
import { generateReportPDF } from "../../../utils/generateReportPDF";

const MySessions = () => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("live");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get("/sessions/my");
        setSessions(res.data.sessions);
      } catch (err) {
        console.error("Failed to fetch sessions", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "Immediate";
    return new Date(dateString).toLocaleString();
  };

  const handleCreateSession = async (payload) => {
    const res = await api.post("/sessions/create", payload);
    setSessions([res.data.session, ...sessions]);
  };

  // Delete confirm handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/sessions/${deleteTarget.roomId}`);
      // Local state update — status cancelled
      setSessions((prev) =>
        prev.map((s) =>
          s._id === deleteTarget._id ? { ...s, status: "cancelled" } : s,
        ),
      );
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to cancel session:", err);
      alert(err.response?.data?.message || "Failed to cancel session.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSession = async (payload) => {
    const res = await api.put(`/sessions/${editTarget.roomId}/edit`, payload);
    setSessions((prev) =>
      prev.map((s) =>
        s._id === editTarget._id ? { ...s, ...res.data.session } : s,
      ),
    );
    setEditTarget(null);
  };

  const handleDownloadReport = async (s) => {
    try {
      setDownloadingId(s.roomId);
      const res = await api.get(`/sessions/${s.roomId}/report`);
      generateReportPDF(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to download report.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredSessions = sessions.filter((s) => s.status === activeTab);

  const counts = {
    live: sessions.filter((s) => s.status === "live").length,
    upcoming: sessions.filter((s) => s.status === "upcoming").length,
    completed: sessions.filter((s) => s.status === "completed").length,
    cancelled: sessions.filter((s) => s.status === "cancelled").length,
  };

  const tabs = [
    { key: "live", label: "Live", count: counts.live },
    { key: "upcoming", label: "Upcoming", count: counts.upcoming },
    { key: "completed", label: "Completed", count: counts.completed },
    { key: "cancelled", label: "Cancelled", count: counts.cancelled },
  ];

  return (
    <div className="ms-tab">
      <div className="ms-page-header">
        <div>
          <h1 className="ms-page-title">My Sessions</h1>
          <p className="ms-breadcrumb">Settings / My Sessions</p>
        </div>
        <button
          className="ms-btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <i className="fa-solid fa-plus"></i> Create Session
        </button>
      </div>

      {/* Chrome-style tab bar */}
      <div className="ms-tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`ms-tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="ms-tab-label">{tab.label}</span>
            <span className="ms-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="ms-card">
        {isLoading ? (
          <div className="ms-empty-state">Loading sessions...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="ms-empty-state">
            <p>
              {activeTab === "live"
                ? "No live sessions right now."
                : activeTab === "upcoming"
                  ? "No upcoming sessions scheduled."
                  : activeTab === "completed"
                    ? "No completed sessions yet."
                    : "No cancelled sessions."}
            </p>
            {activeTab === "upcoming" && (
              <p>Click "+ Create Session" to schedule one.</p>
            )}
          </div>
        ) : (
          <table className="ms-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Scheduled At</th>
                <th>Question(s)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div className="ms-candidate-email">{s.candidateEmail}</div>
                  </td>
                  <td className="ms-text-muted">{formatDate(s.scheduledAt)}</td>
                  <td>
                    <div className="ms-q-title">
                      {s.questions?.[0]?.title || "N/A"}
                      {s.questions?.length > 1 &&
                        ` (+${s.questions.length - 1} more)`}
                    </div>
                  </td>
                  <td>
                    <div className="ms-actions">
                      {s.status === "upcoming" && (
                        <>
                          <button
                            className="ms-btn-text"
                            onClick={() => navigate(`/start/${s.roomId}`)}
                          >
                            <i className="fa-solid fa-arrow-right-to-bracket"></i>{" "}
                            Start
                          </button>
                          <button
                            className="ms-btn-icon"
                            title="Edit session"
                            onClick={() => setEditTarget(s)}
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            className="ms-btn-icon ms-btn-danger"
                            title="Cancel session"
                            onClick={() => setDeleteTarget(s)}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </>
                      )}
                      {s.status === "live" && (
                        <button
                          className="ms-btn-text ms-btn-live"
                          onClick={() => navigate(`/interview/${s.roomId}`)}
                        >
                          <i className="fa-solid fa-circle"></i> Join
                        </button>
                      )}
                      {s.status === "completed" && (
                        <button
                          className="ms-btn-text"
                          onClick={() => handleDownloadReport(s)}
                          disabled={downloadingId === s.roomId}
                        >
                          <i className="fa-solid fa-download"></i>
                          {downloadingId === s.roomId
                            ? " Downloading..."
                            : " Report"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <SessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSession}
        initialData={null}
      />

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Cancel Session?"
        message={`Are you sure you want to cancel the interview with ${deleteTarget?.candidateEmail}? The candidate will be notified by email.`}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <SessionModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEditSession}
        initialData={editTarget}
      />
    </div>
  );
};

export default MySessions;
