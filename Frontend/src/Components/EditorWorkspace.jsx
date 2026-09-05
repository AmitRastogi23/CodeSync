import Editor from "@monaco-editor/react";
import { bindMonaco } from "../Collaboration/Collaboration";
import { useCodeExecution } from "../Hooks/useCodeExecution";
import "../App.css";

const EditorWorkspace = ({
  collaborationRef,
  language,
  input,
  setInput,
  output,
  setOutput,
  roomId,
  socket,
}) => {
  const { runCode } = useCodeExecution({
    collaborationRef,
    socket,
    roomId,
    input,
    setOutput,
  });

  return (
    <div className="editor-wrapper">
      <Editor
        height="60%"
        defaultLanguage={language}
        language={language}
        onMount={(editor) => {
          const collaboration = collaborationRef.current;
          if (!collaboration) return;

          bindMonaco(editor, collaboration);
        }}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
        }}
      />

      <textarea
        className="input-console"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter input here..."
      />

      <button className="run-btn" onClick={runCode}>
        Execute
      </button>

      <textarea
        className="output-console"
        value={output}
        readOnly
        placeholder="Output will appear here"
      />
    </div>
  );
};

export default EditorWorkspace;
