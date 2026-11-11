import "./QuestionDetails.css";

const QuestionDetails = ({ question, isOpen, onClose }) => {
  if (!isOpen || !question) return null;

  // Sirf sample test cases dikhane hain (hidden nahi)
  const sampleTestCases =
    question.testCases?.filter((tc) => !tc.isHidden) || [];

  const getDifficultyClass = (difficulty) => {
    if (difficulty === "Easy") return "qd-badge-easy";
    if (difficulty === "Medium") return "qd-badge-medium";
    return "qd-badge-hard";
  };

  return (
    <>
      {/* Dark Overlay */}
      <div
        className={`qd-overlay ${isOpen ? "open" : ""}`}
        onClick={onClose}
      ></div>

      {/* Right Side Panel */}
      <div className={`qd-panel ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="qd-header">
          <div>
            <h2 className="qd-title">{question.title}</h2>
            <span
              className={`qd-badge ${getDifficultyClass(question.difficulty)}`}
            >
              {question.difficulty}
            </span>
          </div>
          <button className="qd-close" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="qd-body">
          {/* Description */}
          <div className="qd-section">
            <h3 className="qd-section-title">Description</h3>
            <p className="qd-text">{question.description}</p>
          </div>

          {question.exampleImage && (
            <div className="qd-section">
              <h3 className="qd-section-title">Example Image</h3>
              <div className="qd-image-wrapper">
                <img src={question.exampleImage} alt="Example" />
              </div>
            </div>
          )}

          {/* Constraints */}
          {question.constraints && (
            <div className="qd-section">
              <h3 className="qd-section-title">Constraints</h3>
              <pre className="qd-code-block">{question.constraints}</pre>
            </div>
          )}

          {/* Sample Test Cases */}
          {sampleTestCases.length > 0 && (
            <div className="qd-section">
              <h3 className="qd-section-title">Sample Test Cases</h3>
              <div className="qd-test-cases">
                {sampleTestCases.map((tc, index) => (
                  <div key={index} className="qd-tc-card">
                    <div className="qd-tc-row">
                      <span className="qd-tc-label">Input:</span>
                      <code className="qd-tc-value">{tc.input}</code>
                    </div>
                    <div className="qd-tc-row">
                      <span className="qd-tc-label">Output:</span>
                      <code className="qd-tc-value">{tc.expectedOutput}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QuestionDetails;
