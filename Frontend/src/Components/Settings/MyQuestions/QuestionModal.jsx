import { useState, useEffect } from "react";
import "./QuestionModal.css";

const QuestionModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [constraints, setConstraints] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");

  const [testCases, setTestCases] = useState([
    { input: "", expectedOutput: "", isHidden: false },
  ]);

  const [imageFile, setImageFile] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTitle(initialData.title || "");
        setDescription(initialData.description || "");
        setConstraints(initialData.constraints || "");
        setDifficulty(initialData.difficulty || "Medium");
        setTestCases(
          initialData.testCases?.length > 0
            ? initialData.testCases
            : [{ input: "", expectedOutput: "", isHidden: false }],
        );
      } else {
        setTitle("");
        setDescription("");
        setConstraints("");
        setDifficulty("Medium");
        setTestCases([{ input: "", expectedOutput: "", isHidden: false }]);
      }
      setImageFile(null);
      setError("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleAddTestCase = () => {
    setTestCases([
      ...testCases,
      { input: "", expectedOutput: "", isHidden: false },
    ]);
  };

  const handleRemoveTestCase = (index) => {
    const updated = testCases.filter((_, i) => i !== index);
    setTestCases(updated);
  };

  const handleTestCaseChange = (index, field, value) => {
    const updated = [...testCases];
    updated[index][field] = value;
    setTestCases(updated);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title || !description) {
      return setError("Title and Description are required.");
    }
    if (testCases.length === 0) {
      return setError("At least one test case is required.");
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("constraints", constraints);
      formData.append("difficulty", difficulty);
      formData.append("testCases", JSON.stringify(testCases));

      if (imageFile) {
        formData.append("image", imageFile);
      }

      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save question");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="qm-overlay">
      <div className="qm-container">
        <div className="qm-header">
          <h2>{initialData ? "Edit Question" : "Add New Question"}</h2>
          <button type="button" className="qm-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="qm-form">
          <div className="qm-body">
            {error && <div className="qm-error">{error}</div>}

            {/* Section 1 */}
            <div className="qm-section">
              <h3 className="qm-section-title">Basic Details</h3>
              <div className="qm-row">
                <div className="qm-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Two Sum"
                    required
                  />
                </div>
                <div className="qm-group" style={{ maxWidth: "150px" }}>
                  <label>Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="qm-group">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the problem statement..."
                  rows="3"
                  required
                />
              </div>
              {/* 👇 Image Upload Section (Compact) */}
              <div className="qm-group">
                <label>Example Image (Optional)</label>
                {!imageFile ? (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="qm-file-input"
                  />
                ) : (
                  <div className="qm-file-selected">
                    <span className="qm-file-name">
                      <i className="fa-solid fa-image"></i> {imageFile.name}
                    </span>
                    <button
                      type="button"
                      className="qm-remove-btn"
                      onClick={() => {
                        setImageFile(null);
                      }}
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                )}
              </div>
              <div className="qm-group">
                <label>Constraints</label>
                <textarea
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder="e.g., 1 <= nums.length <= 10^4"
                  rows="2"
                />
              </div>
            </div>

            {/* Section 2: Test Cases */}
            <div className="qm-section">
              <div className="qm-tc-header">
                <h3 className="qm-section-title">Test Cases</h3>
                <button
                  type="button"
                  className="qm-btn-text"
                  style={{
                    color: "#0A0A0B",
                    padding: "6px 12px",
                    background: "#F5F5F5",
                    borderRadius: "6px",
                  }}
                  onClick={handleAddTestCase}
                >
                  + Add
                </button>
              </div>

              {/* Table Header for Test Cases */}
              <div className="qm-tc-labels">
                <span>Input</span>
                <span>Expected Output</span>
                <span>Hidden</span>
                <span></span>
              </div>

              {testCases.map((tc, index) => (
                <div key={index} className="qm-tc-row">
                  <div className="qm-group">
                    <input
                      type="text"
                      value={tc.input}
                      onChange={(e) =>
                        handleTestCaseChange(index, "input", e.target.value)
                      }
                      placeholder="e.g., [2,7,11,15], 9"
                      required
                    />
                  </div>
                  <div className="qm-group">
                    <input
                      type="text"
                      value={tc.expectedOutput}
                      onChange={(e) =>
                        handleTestCaseChange(
                          index,
                          "expectedOutput",
                          e.target.value,
                        )
                      }
                      placeholder="e.g., [0,1]"
                      required
                    />
                  </div>
                  <div className="qm-group qm-checkbox-wrap">
                    <label className="qm-checkbox-label">
                      <input
                        type="checkbox"
                        checked={tc.isHidden}
                        onChange={(e) =>
                          handleTestCaseChange(
                            index,
                            "isHidden",
                            e.target.checked,
                          )
                        }
                      />
                      <span className="qm-checkmark"></span>
                    </label>
                  </div>
                  <div className="qm-group">
                    {testCases.length > 1 && (
                      <button
                        type="button"
                        className="qm-remove-btn"
                        onClick={() => handleRemoveTestCase(index)}
                        title="Remove Test Case"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="qm-footer">
            <button
              type="button"
              className="qm-btn-text"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="qm-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? initialData
                  ? "Updating..."
                  : "Creating..."
                : initialData
                  ? "Update Question"
                  : "Create Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionModal;
