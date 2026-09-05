import { useState } from "react";

export const useRoomState = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setlanguage] = useState("javascript");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");

  return {
    joined,
    setJoined,
    roomId,
    setRoomId,
    userName,
    setUserName,
    language,
    setlanguage,
    users,
    setUsers,
    typing,
    setTyping,
    output,
    setOutput,
    input,
    setInput,
  };
};
