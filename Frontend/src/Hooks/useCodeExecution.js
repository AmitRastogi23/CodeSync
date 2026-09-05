export const useCodeExecution = ({
  collaborationRef,
  socket,
  roomId,
  input,
  setOutput,
}) => {
  const runCode = () => {
    const doc = collaborationRef.current?.doc;
    if (!doc) return;

    const code = doc.getText("code").toString();
    const language = doc.getMap("meta").get("language");

    if (!code.trim()) {
      setOutput("Please write some code first!");
      return;
    }

    setOutput("⏳ Executing...");

    socket.emit("compileCode", {
      code,
      roomId,
      language,
      input,
    });
  };

  return { runCode };
};
