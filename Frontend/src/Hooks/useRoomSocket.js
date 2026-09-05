import { useEffect } from "react";

export const useRoomSocket = (
  socket,
  setUsers,
  setTyping,
  collaborationRef,
) => {
  useEffect(() => {
    const handleUsers = (users) => {
      setUsers(users);
    };

    const handleTyping = (user) => {
      setTyping(`${user} is typing....`);
      setTimeout(() => {
        setTyping("");
      }, 2000);
    };

    const handleCodeResponse = (response) => {
      const doc = collaborationRef.current?.doc;
      if (!doc) return;
      const output = doc.getText("output");
      output.delete(0, output.length);
      output.insert(0, response?.output || "No output");
    };

    socket.on("userJoined", handleUsers);
    socket.on("userTyping", handleTyping);
    socket.on("codeResponse", handleCodeResponse);

    return () => {
      socket.off("userJoined", handleUsers);
      socket.off("userTyping", handleTyping);
      socket.off("codeResponse", handleCodeResponse);
    };
  }, [socket, setUsers, setTyping, collaborationRef]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [socket]);
};
