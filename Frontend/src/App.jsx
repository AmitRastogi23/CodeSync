import "./App.css";
import { useState } from "react";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";
import { useEffect } from "react";

const socket = io("http://localhost:5000");

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setlanguage] = useState("javascript");
  const [code, setCode] = useState("// start code here");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");

  useEffect(() => {
    socket.on("userJoined", (users) => {
      setUsers(users);
    });
    socket.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });
    socket.on("userTyping", (user) => {
      setTyping(`${user} is typing....`);
      setTimeout(() => {
        setTyping("");
      }, 2000);
    });
    socket.on("languageUpdate", (newlang) => {
      setlanguage(newlang);
    });
    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const joinRoom = (e) => {
    e.preventDefault();
    if (roomId && userName) {
      socket.emit("join", { roomId, userName });
      setJoined(true);
    } else {
      alert("Please enter Room ID and Name");
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied!!");
    setTimeout(() => {
      setCopySuccess("");
    }, 2000);
  };

  const handleCodeChange = (newCode) => {
    if (roomId && userName) {
      setCode(newCode);
      socket.emit("codeChange", { roomId, code: newCode });
      socket.emit("typing", { roomId, userName });
    }
  };

  const handleLanguageChange = (e) => {
    const newlang = e.target.value;
    setlanguage(newlang);
    socket.emit("languageChange", { roomId, language: newlang });
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setCode("// start code here");
    setlanguage("javascript");
  };

  if (!joined) {
    return (
      <div className="join-container">
        <form action="" className="join-form" onSubmit={joinRoom}>
          <h1>Join Code Room</h1>
          <input
            type="text"
            placeholder="Enter the Room ID"
            value={roomId}
            onChange={(e) => {
              setRoomId(e.target.value);
            }}
          />

          <input
            type="text"
            placeholder="Enter your Name"
            value={userName}
            onChange={(e) => {
              setUserName(e.target.value);
            }}
          />

          <button type="submit">Join Room</button>
        </form>
      </div>
    );
  }
  return (
    <div className="editor-container">
      <div className="sidebar">
        <div className="room-info">
          <h2>Code Room : {roomId}</h2>
          <button onClick={copyRoomId} className="copy-button">
            Copy Room ID
          </button>
          {copySuccess && <span className="copySuccess">{copySuccess}</span>}
        </div>

        <h3>Users in Room : </h3>
        <ul>
          {users.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>

        <p className="typing-indicator">{typing}</p>

        <select
          className="language-selector"
          value={language}
          onChange={handleLanguageChange}
        >
          <option value="javascript">Javascript</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="python">Python</option>
        </select>

        <button className="leave-button" onClick={leaveRoom}>
          Leave Room
        </button>
      </div>

      <div className="editor-wrapper">
        <Editor
          height={"100%"}
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
          }}
        />
      </div>
    </div>
  );
};

export default App;
