import "./InterviewQuestionPanel.css";

const InterviewQuestionPanel = ({ question }) => {
  if (!question) return null;

  const sampleTestCases =
    question.testCases?.filter((tc) => !tc.isHidden) || [];

  return (
    <div className="iqp-panel">
      <div className="iqp-header">
        <h2 className="iqp-title">{question.title}</h2>
      </div>

      <div className="iqp-body">
        <div className="iqp-section">
          <h3 className="iqp-section-title">Description</h3>
          <p className="iqp-text">{question.description}</p>
        </div>

        {question.exampleImage && (
          <div className="iqp-section">
            <h3 className="iqp-section-title">Example Image</h3>
            <div className="iqp-image-wrapper">
              <img src={question.exampleImage} alt="Example" />
            </div>
          </div>
        )}

        {question.constraints && (
          <div className="iqp-section">
            <h3 className="iqp-section-title">Constraints</h3>
            <pre className="iqp-code-block">{question.constraints}</pre>
          </div>
        )}

        {sampleTestCases.length > 0 && (
          <div className="iqp-section">
            <h3 className="iqp-section-title">Sample Test Cases</h3>
            <div className="iqp-test-cases">
              {sampleTestCases.map((tc, index) => (
                <div key={index} className="iqp-tc-card">
                  <div className="iqp-tc-row">
                    <span className="iqp-tc-label">Input:</span>
                    <code className="iqp-tc-value">{tc.input}</code>
                  </div>
                  <div className="iqp-tc-row">
                    <span className="iqp-tc-label">Output:</span>
                    <code className="iqp-tc-value">{tc.expectedOutput}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewQuestionPanel;
