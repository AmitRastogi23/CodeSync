import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import "./EditorWorkspace.css";

const EditorWorkspace = ({
  roomId,
  socket,
  language,
  setLanguage,
  questionId,
  setActiveQuestionIndex,
  changeQuestionRef,
}) => {
  const editorRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);

  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResults, setSubmitResults] = useState([]);
  const [showSubmitResults, setShowSubmitResults] = useState(false);

  // Refs
  const lastRunTimeRef = useRef(0);
  const lastSubmitTimeRef = useRef(0);
  const isFirstLoad = useRef(true);

  // 1. Initialize Yjs
  useEffect(() => {
    const doc = new Y.Doc();
    const provider = new WebsocketProvider(
      import.meta.env.VITE_YJS_URL,
      roomId,
      doc,
    );
    providerRef.current = provider;

    if (changeQuestionRef) {
      changeQuestionRef.current = (idx) => {
        provider.doc.getMap("meta").set("questionIndex", idx);
      };
    }

    const codeText = doc.getText("code");
    const metaMap = doc.getMap("meta");

    provider.on("synced", () => {
      if (codeText.length === 0) {
        codeText.insert(0, "// Write your code here");
      }
      if (!metaMap.has("language")) metaMap.set("language", "javascript");
      if (!metaMap.has("questionIndex")) metaMap.set("questionIndex", 0);
      if (!metaMap.has("isRunning")) metaMap.set("isRunning", false);
      if (!metaMap.has("isSubmitting")) metaMap.set("isSubmitting", false);
      if (!metaMap.has("testResults")) metaMap.set("testResults", "[]");
      if (!metaMap.has("submitResults")) metaMap.set("submitResults", "[]");
      if (!metaMap.has("runResultTime")) metaMap.set("runResultTime", 0);
      if (!metaMap.has("submitResultTime")) metaMap.set("submitResultTime", 0);
    });

    const updateLanguage = () => {
      setLanguage(metaMap.get("language") || "javascript");
    };
    metaMap.observe(updateLanguage);

    const updateQuestionIndex = () => {
      const idx = metaMap.get("questionIndex");
      if (idx !== undefined && setActiveQuestionIndex) {
        setActiveQuestionIndex(idx);
      }
    };
    metaMap.observe(updateQuestionIndex);
    updateQuestionIndex();

    // Core Logic (Run/Submit)
    const updateStates = () => {
      setIsRunning(metaMap.get("isRunning") || false);
      setIsSubmitting(metaMap.get("isSubmitting") || false);

      const runResultTime = metaMap.get("runResultTime") || 0;
      const submitResultTime = metaMap.get("submitResultTime") || 0;

      if (isFirstLoad.current) {
        lastRunTimeRef.current = runResultTime;
        lastSubmitTimeRef.current = submitResultTime;
        isFirstLoad.current = false;

        const runData = metaMap.get("testResults");
        if (runData) {
          try {
            setTestResults(JSON.parse(runData));
          } catch (e) {
            console.log(e);
          }
        }
        const submitData = metaMap.get("submitResults");
        if (submitData) {
          try {
            setSubmitResults(JSON.parse(submitData));
          } catch (e) {
            console.log(e);
          }
        }
        return;
      }

      if (runResultTime > lastRunTimeRef.current) {
        const runData = metaMap.get("testResults");
        if (runData) {
          try {
            setTestResults(JSON.parse(runData));
            setShowResults(true);
            lastRunTimeRef.current = runResultTime;
          } catch (e) {
            console.log(e);
          }
        }
      }

      if (submitResultTime > lastSubmitTimeRef.current) {
        const submitData = metaMap.get("submitResults");
        if (submitData) {
          try {
            setSubmitResults(JSON.parse(submitData));
            setShowSubmitResults(true);
            lastSubmitTimeRef.current = submitResultTime;
          } catch (e) {
            console.log(e);
          }
        }
      }
    };
    metaMap.observe(updateStates);

    if (editorRef.current) {
      bindingRef.current = new MonacoBinding(
        codeText,
        editorRef.current.getModel(),
        new Set([editorRef.current]),
        provider.awareness,
      );
    }

    return () => {
      provider.destroy();
      metaMap.unobserve(updateLanguage);
      metaMap.unobserve(updateQuestionIndex);
      metaMap.unobserve(updateStates);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // 2. Socket Listeners
  useEffect(() => {
    const handleTestCasesResult = (data) => {
      const provider = providerRef.current;
      if (provider) {
        const metaMap = provider.doc.getMap("meta");
        metaMap.set("isRunning", false);

        if (data.error) {
          alert(`Error: ${data.error}`);
          metaMap.set("testResults", "[]");
        } else {
          metaMap.set("testResults", JSON.stringify(data.results));
          metaMap.set("runResultTime", Date.now());
        }
      }
    };

    const handleSubmitResult = (data) => {
      const provider = providerRef.current;
      if (provider) {
        const metaMap = provider.doc.getMap("meta");
        metaMap.set("isSubmitting", false);

        if (data.error) {
          alert(`Error: ${data.error}`);
          metaMap.set("submitResults", "[]");
        } else {
          metaMap.set("submitResults", JSON.stringify(data.results));
          metaMap.set("submitResultTime", Date.now());
        }
      }
    };

    socket.on("testCasesResult", handleTestCasesResult);
    socket.on("submitResult", handleSubmitResult);

    return () => {
      socket.off("testCasesResult", handleTestCasesResult);
      socket.off("submitResult", handleSubmitResult);
    };
  }, [socket]);

  // 3. Run Code
  const handleRunCode = () => {
    const provider = providerRef.current;
    if (!provider) return;

    const metaMap = provider.doc.getMap("meta");

    if (metaMap.get("isRunning") || metaMap.get("isSubmitting")) {
      return alert("Wait! Another operation is in progress.");
    }

    const doc = provider.doc;
    const code = doc.getText("code").toString();
    const currentLang = metaMap.get("language");

    if (!code.trim()) {
      return alert("Please write some code first!");
    }

    metaMap.set("isRunning", true);
    setShowResults(false);

    socket.emit("runTestCases", {
      code,
      roomId,
      language: currentLang,
      questionId,
    });
  };

  // 4. Submit Code
  const handleSubmitCode = () => {
    const provider = providerRef.current;
    if (!provider) return;

    const metaMap = provider.doc.getMap("meta");

    if (metaMap.get("isRunning") || metaMap.get("isSubmitting")) {
      return alert("Wait! Another operation is in progress.");
    }

    const doc = provider.doc;
    const code = doc.getText("code").toString();
    const currentLang = metaMap.get("language");

    if (!code.trim()) {
      return alert("Please write some code first!");
    }

    metaMap.set("isSubmitting", true);
    setShowSubmitResults(false);

    socket.emit("submitTestCases", {
      code,
      roomId,
      language: currentLang,
      questionId,
    });
  };

  // 5. Language Change
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (providerRef.current) {
      providerRef.current.doc.getMap("meta").set("language", newLang);
    }
  };

  return (
    <div className="ew-container">
      <div className="ew-toolbar">
        <div className="ew-toolbar-left">
          <select
            className="ew-lang-select"
            value={language}
            onChange={handleLanguageChange}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="c">C</option>
            <option value="php">PHP</option>
          </select>
        </div>

        <div className="ew-toolbar-right">
          <button
            className="ew-btn-run"
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
          >
            {isRunning ? "Running..." : "Run Code"}
          </button>
          <button
            className="ew-btn-submit"
            onClick={handleSubmitCode}
            disabled={isRunning || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      <div className="ew-editor-wrapper">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          language={language}
          theme="light"
          onMount={(editor) => {
            editorRef.current = editor;
            const provider = providerRef.current;
            if (provider) {
              const codeText = provider.doc.getText("code");
              bindingRef.current = new MonacoBinding(
                codeText,
                editor.getModel(),
                new Set([editor]),
                provider.awareness,
              );
            }
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            padding: { top: 16 },
            renderLineHighlight: "none",
            lineNumbersMinChars: 3,
            glyphMargin: false,
            renderValidationDecorations: "off",
          }}
        />
      </div>

      {/* Run Results Modal */}
      {showResults && (
        <div className="ew-results-modal">
          <div className="ew-results-header">
            <h4>Run Results</h4>
            <div className="ew-results-summary">
              <span>
                {testResults.filter((r) => r.passed).length} /{" "}
                {testResults.length} Passed
              </span>
              <button
                className="ew-close-results"
                onClick={() => setShowResults(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
          <div className="ew-results-list">
            {testResults.map((res, idx) => (
              <div
                key={idx}
                className={`ew-result-item ${res.passed ? "passed" : "failed"}`}
              >
                <div className="ew-result-title">
                  <i
                    className={`fa-solid ${res.passed ? "fa-circle-check" : "fa-circle-xmark"}`}
                  ></i>
                  Test Case {res.testCase} - {res.passed ? "Passed" : "Failed"}
                </div>
                <div className="ew-result-body">
                  <p>
                    <strong>Input:</strong> {res.input}
                  </p>
                  <p>
                    <strong>Expected:</strong> {res.expected}
                  </p>
                  <p>
                    <strong>Your Output:</strong> {res.output}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Results Modal */}
      {showSubmitResults && (
        <div className="ew-results-modal">
          <div className="ew-results-header">
            <h4>Submission Results</h4>
            <div className="ew-results-summary">
              <span>
                {submitResults.filter((r) => r.passed).length} /{" "}
                {submitResults.length} Passed
              </span>
              <button
                className="ew-close-results"
                onClick={() => setShowSubmitResults(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
          <div className="ew-submit-tiles">
            {submitResults.map((res, idx) => (
              <div
                key={idx}
                className={`ew-submit-tile ${res.passed ? "passed" : "failed"}`}
              >
                <span>Test Case {res.testCase}</span>
                <i
                  className={`fa-solid ${res.passed ? "fa-circle-check" : "fa-circle-xmark"}`}
                ></i>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorWorkspace;
