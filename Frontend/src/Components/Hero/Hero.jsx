import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Hero.css";

const Hero = () => {
  const { user } = useAuth();
  return (
    <section className="hero">
      <div className="hero-container">
        {/* Left Column */}
        <div className="hero-left">
          {/* Badge */}
          <div className="hero-badge">
            <span className="badge-dot"></span>
            <span>Real-time</span>
            <span className="badge-sep">•</span>
            <span>Collaborative</span>
            <span className="badge-sep">•</span>
            <span>Interview Ready</span>
          </div>

          {/* Headline */}
          <h1 className="hero-title">
            <span className="title-dark">Code</span>
            <span className="title-accent">Sync</span>
            <br />
            Real Time Collaborative
            <br />
            Interview Platform
          </h1>

          {/* Subheadline */}
          <p className="hero-subtitle">
            Code together. Solve together. Build better.
            <br />
            Join live coding sessions, collaborate in real time,
            <br />
            chat with your team and ace your interviews — all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="hero-ctas">
            {!user && (
              <NavLink to={"/login"} className="cta-primary">
                Get Started
                <span className="cta-arrow">→</span>
              </NavLink>
            )}
            <button className="cta-secondary">
              <span className="play-icon">▶</span>
              Watch Demo
            </button>
          </div>

          {/* Social Proof */}
          <div className="hero-proof">
            <div className="proof-avatars">
              <img src="https://i.pravatar.cc/40?img=1" alt="user" />
              <img src="https://i.pravatar.cc/40?img=2" alt="user" />
              <img src="https://i.pravatar.cc/40?img=3" alt="user" />
              <img src="https://i.pravatar.cc/40?img=4" alt="user" />
            </div>
            <div className="proof-text">
              <strong>Join 10,000+ developers</strong>
              <span>building together</span>
            </div>
          </div>
        </div>

        {/* Right Column — Mockup Image */}
        <div className="hero-right">
          <div className="hero-illustration">
            {/* Main mockup image */}
            <img
              src="/heroUImockup.png"
              alt="CodeSync collaborative editor preview"
              className="hero-mockup-img"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
