import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Signup.css";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // OTP States
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");

  const { sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const [cooldown, setCooldown] = useState(0);
  const [loadingType, setLoadingType] = useState(null); // "verify" ya "resend"

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };
  const handleGithubLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/github`;
  };

  // Step 1: Form Submit (Send OTP)
  const handleRegister = async (e, isResend = false) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    setIsLoading(true);
    setLoadingType(isResend ? "resend" : "submit");

    try {
      await sendOTP(name, email, password);
      setShowOTP(true);
      setCooldown(60); // 👈 Timer start
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setLoadingType("verify");

    try {
      await verifyOTP(email, otp);
      navigate("/"); // Success! Home page pe jao
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <section className="signup-page">
      <div className="signup-container">
        {/* ---------- Left Column ---------- */}
        <div className="signup-left">
          {/* Badge */}
          <div className="signup-badge">
            <span className="signup-badge-dot"></span>
            <span>Welcome Back</span>
          </div>

          {/* Headline */}
          <h1 className="signup-title">
            Get Started with
            <br />
            <span className="signup-title-accent">CodeSync</span>
          </h1>

          {/* Sub-headline */}
          <h3 className="signup-subhead">Ready to collaborate and grow?</h3>

          {/* Subtitle */}
          <p className="signup-subtitle">
            Create your account to join a vibrant community of developers,
            collaborate on projects, and build your skills.
          </p>

          {/* Feature List */}
          <div className="signup-features">
            <div className="signup-feature">
              <div className="feature-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 6L3 12L8 18"
                    stroke="#0A0A0B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 6L21 12L16 18"
                    stroke="#0A0A0B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="feature-text">
                <h4>Collaborate in real-time</h4>
                <p>Work together on the same code, instantly.</p>
              </div>
            </div>

            <div className="signup-feature">
              <div className="feature-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="9"
                    cy="8"
                    r="3"
                    stroke="#0A0A0B"
                    strokeWidth="2"
                  />
                  <path
                    d="M3 20C3 16.6863 5.68629 14 9 14C12.3137 14 15 16.6863 15 20"
                    stroke="#0A0A0B"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="17"
                    cy="9"
                    r="2.5"
                    stroke="#0A0A0B"
                    strokeWidth="2"
                  />
                  <path
                    d="M15 20C15 17.5 16.5 15.5 19 15"
                    stroke="#0A0A0B"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="feature-text">
                <h4>Join live interviews</h4>
                <p>Practice, improve and ace your interviews.</p>
              </div>
            </div>

            <div className="signup-feature">
              <div className="feature-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13 2L4 14H11L10 22L20 9H13L13 2Z"
                    stroke="#0A0A0B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="feature-text">
                <h4>Build your skills</h4>
                <p>Learn, code and grow — all in one place.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Right Column — Signup Card ---------- */}
        <div className="signup-right">
          {/* Light green background shape */}
          <div className="signup-bg-shape"></div>

          {/* Decorative stroke lines */}
          <svg className="signup-deco-strokes" viewBox="0 0 40 40" fill="none">
            <path
              d="M8 32 L 14 12"
              stroke="#C6F432"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M18 34 L 24 14"
              stroke="#C6F432"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M28 36 L 34 16"
              stroke="#C6F432"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          {/* Signup Card */}
          <div className="signup-card">
            {/* Card Logo */}
            <div className="card-logo">
              <svg
                className="card-logo-icon"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 8L4 16L10 24"
                  stroke="#0A0A0B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 8L28 16L22 24"
                  stroke="#0A0A0B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18 6L14 26"
                  stroke="#C6F432"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="card-logo-text">
                Code<span className="card-logo-accent">Sync</span>
              </span>
            </div>

            {/* ERROR MESSAGE */}
            {error && <div className="error-message">{error}</div>}

            {/* CONDITION: Agar showOTP true hai toh OTP Form, warna Signup Form */}
            {!showOTP ? (
              <>
                <h2 className="card-title">Create an Account</h2>
                <p className="card-subtitle">
                  Let's build together! Please enter your details below.
                </p>

                <form className="signup-form" onSubmit={handleRegister}>
                  {/* Name Input */}
                  <div className="form-group">
                    <label htmlFor="username">Full Name</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle
                            cx="12"
                            cy="8"
                            r="4"
                            stroke="#8A8A8F"
                            strokeWidth="2"
                          />
                          <path
                            d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
                            stroke="#8A8A8F"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <input
                        type="text"
                        id="username"
                        placeholder="e.g., Amit Kumar"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect
                            x="3"
                            y="5"
                            width="18"
                            height="14"
                            rx="2"
                            stroke="#8A8A8F"
                            strokeWidth="2"
                          />
                          <path
                            d="M3 7L12 13L21 7"
                            stroke="#8A8A8F"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <input
                        type="email"
                        id="email"
                        placeholder="e.g., alex@gmail.com"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect
                            x="5"
                            y="11"
                            width="14"
                            height="10"
                            rx="2"
                            stroke="#8A8A8F"
                            strokeWidth="2"
                          />
                          <path
                            d="M8 11V8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8V11"
                            stroke="#8A8A8F"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"
                            stroke="#8A8A8F"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                            stroke="#8A8A8F"
                            strokeWidth="2"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="signup-submit"
                    disabled={isLoading}
                  >
                    {loadingType === "submit"
                      ? "Sending OTP..."
                      : "Create Account"}
                    {!isLoading && <span className="submit-arrow">→</span>}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="card-title">Verify your Email</h2>
                <p className="card-subtitle">
                  We sent a 6-digit code to <strong>{email}</strong>. Please
                  enter it below.
                </p>

                <form className="signup-form" onSubmit={handleVerifyOTP}>
                  {/* OTP Input */}
                  <div className="form-group">
                    <label htmlFor="otp">Enter OTP</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        id="otp"
                        placeholder="123456"
                        maxLength="6"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        className="otp-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="signup-submit"
                    disabled={isLoading && loadingType === "verify"}
                  >
                    {isLoading && loadingType === "verify"
                      ? "Verifying..."
                      : "Verify & Create Account"}
                    {!(isLoading && loadingType === "verify") && (
                      <span className="submit-arrow">→</span>
                    )}
                  </button>
                </form>

                <p className="login-text">
                  Didn't receive code?{" "}
                  {cooldown > 0 ? (
                    <span style={{ color: "#8A8A8F", fontWeight: "bold" }}>
                      Resend in {cooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="forgot-link"
                      onClick={() => handleRegister(null, true)} // 👈 true pass kiya
                      disabled={isLoading}
                    >
                      {loadingType === "resend" ? "Sending..." : "Resend OTP"}
                    </button>
                  )}
                </p>
              </>
            )}

            {/* Social Buttons (Sirf tab dikhein jab OTP screen na ho) */}
            {!showOTP && (
              <>
                <div className="divider">
                  <span>OR</span>
                </div>
                <button
                  type="button"
                  className="social-btn"
                  onClick={handleGithubLogin}
                >
                  <svg
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    className="social-icon"
                  >
                    <path
                      fill="#0A0A0B"
                      d="M12 1C5.923 1 1 5.923 1 12c0 4.867 3.149 8.979 7.521 10.438.55.1.752-.236.752-.525v-2.05c-3.057.66-3.7-1.32-3.7-1.32-.5-1.27-1.226-1.605-1.226-1.605-1.004-.686.076-.672.076-.672 1.11.078 1.695 1.14 1.695 1.14.986 1.69 2.586 1.202 3.216.92.1-.715.386-1.203.703-1.48-2.44-.278-5.005-1.22-5.005-5.43 0-1.2.43-2.18 1.134-2.95-.115-.278-.492-1.4.107-2.92 0 0 .925-.296 3.03 1.13a10.53 10.53 0 0 1 5.516 0c2.104-1.426 3.028-1.13 3.028-1.13.6 1.52.223 2.642.11 2.92.705.77 1.133 1.75 1.133 2.95 0 4.22-2.57 5.148-5.018 5.42.396.34.749 1.011.749 2.038v3.02c0 .29.2.63.756.523C19.853 20.977 23 16.866 23 12c0-6.077-4.923-11-11-11z"
                    />
                  </svg>
                  Continue with GitHub
                </button>
                <button
                  type="button"
                  className="social-btn mt-10"
                  onClick={handleGoogleLogin}
                >
                  <svg
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    className="social-icon"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>
              </>
            )}

            {!showOTP && (
              <p className="login-text">
                Already have an account? <NavLink to={"/login"}>Login</NavLink>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signup;
