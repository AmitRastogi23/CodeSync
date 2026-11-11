import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./HowItWorks.css";

const HowItWorks = () => {
  const { user } = useAuth();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const stepsList = [
    {
      num: "01",
      icon: "fa-solid fa-envelope-open-text",
      title: "Setup & Share",
      desc: "The interviewer creates custom coding questions, adds test cases, and schedules a session by entering the candidate's email.",
    },
    {
      num: "02",
      icon: "fa-solid fa-user-clock",
      title: "Secure Waiting Room",
      desc: "The candidate clicks the link, checks their audio/video settings, enters fullscreen, and waits for the interviewer to admit them.",
    },
    {
      num: "03",
      icon: "fa-solid fa-code",
      title: "Live Collaboration",
      desc: "Once admitted, both can write code in real-time, draw on the whiteboard, and communicate via chat and video securely.",
    },
    {
      num: "04",
      icon: "fa-solid fa-file-pdf",
      title: "Analytics & Reports",
      desc: "After the interview, the interviewer can generate a PDF report with final code, test case results, notes, and violations.",
    },
  ];

  return (
    <div className="hiw-page">
      <div className="hiw-glow"></div>

      <div className="hiw-container">
        {/* Header Section */}
        <div className="hiw-header">
          <div className="hiw-badge">
            <span className="badge-dot"></span> The Workflow
          </div>
          <h1 className="hiw-title">
            How <span>CodeSync</span> Works
          </h1>
          <p className="hiw-subtitle">
            From setting up the questions to generating the final report, here
            is the complete lifecycle of an interview.
          </p>
        </div>

        {/* Horizontal Timeline Container */}
        <div className="hiw-timeline-container">
          <div className="hiw-line-base"></div>
          <div
            className="hiw-line-progress"
            style={{
              width:
                hoveredIndex !== null
                  ? `${(hoveredIndex / (stepsList.length - 1)) * 100}%`
                  : "0%",
              opacity: hoveredIndex !== null ? 1 : 0,
            }}
          ></div>

          <div className="hiw-nodes-wrapper">
            {stepsList.map((step, index) => (
              <div
                className={`hiw-step-item ${hoveredIndex === index ? "active" : ""}`}
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="hiw-node">
                  <span>{step.num}</span>
                </div>

                <div className="hiw-card">
                  <div className="hiw-icon-wrapper">
                    <i className={step.icon}></i>
                  </div>
                  <h3 className="hiw-card-title">{step.title}</h3>
                  <p className="hiw-card-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 👇 NAYA: CTA Area (Same as Features) */}
        <div className="hiw-cta-area">
          <div className="hiw-cta-content">
            <h2>Ready to take interviews?</h2>
            <p>Join thousands of developers acing their technical rounds.</p>
            {user ? (
              <NavLink to="/settings/sessions" className="hiw-cta-btn">
                Create a Session →
              </NavLink>
            ) : (
              <NavLink to="/login" className="hiw-cta-btn">
                Get Started Now →
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
