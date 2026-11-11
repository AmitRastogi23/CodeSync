import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Feature.css";

const Features = () => {
  const { user } = useAuth();

  const featuresList = [
    {
      icon: "fa-solid fa-shield-halved",
      title: "Secure Authentication",
      desc: "Sign in effortlessly with Local Email, Google, or GitHub. Industry-standard security protocols ensure your data is always protected.",
    },
    {
      icon: "fa-solid fa-layer-group",
      title: "Personal Question Bank",
      desc: "Create, manage, and organize your own custom coding questions with detailed test cases. Build your library and reuse it.",
    },
    {
      icon: "fa-solid fa-share-nodes",
      title: "Seamless Sharing",
      desc: "Collaborate with your team. Share specific questions with colleagues via email, and seamlessly integrate shared questions.",
    },
    {
      icon: "fa-solid fa-lock",
      title: "Strict Room Access",
      desc: "Zero gate-crashers. Strictly enforced room security ensures that only the assigned interviewer and the invited candidate can access the session.",
    },
    {
      icon: "fa-solid fa-user-clock",
      title: "Smart Waiting Room",
      desc: "The candidate enters a secure waiting room. The interview only begins when the interviewer explicitly verifies and admits them.",
    },
    {
      icon: "fa-solid fa-eye",
      title: "Proctoring & Violations",
      desc: "Full focus required. The platform detects if the candidate exits fullscreen mode or switches tabs, instantly notifying the interviewer.",
    },
    {
      icon: "fa-solid fa-code",
      title: "Real-Time Code Editor",
      desc: "A powerful collaborative Monaco editor. Both participants can write, edit, and see each other's code changes in real-time with zero lag.",
    },
    {
      icon: "fa-solid fa-play",
      title: "Instant Code Execution",
      desc: "Run code against sample test cases or submit it for a strict evaluation against hidden test cases. Instant feedback with detailed output.",
    },
    {
      icon: "fa-solid fa-chalkboard-user",
      title: "Collaborative Whiteboard",
      desc: "Brainstorm visually. A real-time synchronized whiteboard where both the interviewer and candidate can draw and share ideas.",
    },
    {
      icon: "fa-solid fa-comments",
      title: "Integrated Chat & A/V",
      desc: "Communicate effortlessly. Built-in chat, along with seamless audio and video capabilities, keep the conversation flowing.",
    },
    {
      icon: "fa-solid fa-note-sticky",
      title: "Private Interviewer Notes",
      desc: "Evaluate privately. The interviewer has access to a secure, real-time notepad during the session to jot down key observations.",
    },
    {
      icon: "fa-solid fa-file-pdf",
      title: "Automated Reports",
      desc: "Comprehensive post-interview analytics. Generate and download a professional PDF report containing submitted code and test case results.",
    },
  ];

  return (
    <div className="features-page">
      <div className="features-glow"></div>

      <div className="features-container">
        <div className="features-header">
          <div className="features-badge">
            <span className="badge-dot"></span> Platform Capabilities
          </div>
          <h1 className="features-title">
            The Ultimate <span>Interview</span> Ecosystem
          </h1>
          <p className="features-subtitle">
            CodeSync goes beyond a simple code editor. We provide a complete,
            secure, and observable environment for technical interviews.
          </p>
        </div>

        <div className="features-grid">
          {featuresList.map((feature, index) => (
            <div className="feature-card" key={index}>
              <div className="feature-card-header">
                <div className="feature-icon-wrapper">
                  <i className={feature.icon}></i>
                </div>
                <h3 className="feature-card-title">{feature.title}</h3>
              </div>
              <p className="feature-card-desc">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="features-cta-area">
          <div className="features-cta-content">
            <h2>Ready to take interviews?</h2>
            <p>Join thousands of developers acing their technical rounds.</p>

            {user ? (
              <NavLink to="/settings/sessions" className="features-cta-btn">
                Create a Session →
              </NavLink>
            ) : (
              <NavLink to="/login" className="features-cta-btn">
                Get Started Now →
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
