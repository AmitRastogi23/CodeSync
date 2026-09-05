import { useEffect, useState } from "react";
import Chat from "./Chat";

const RoomSidebar = ({
  roomId,
  users,
  typing,
  language,
  collaborationRef,
  leaveRoom,
  socket,
  userName,
}) => {
  const [showChat, setShowChat] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const handleChatHistory = (history) => {
      setMessages(history);
    };

    const handleReceiveMessage = (data) => {
      setMessages((prev) => [...prev, data]);
      if (!showChat && data.userName !== userName) {
        setUnreadMessages((prev) => prev + 1);
      }
    };

    socket.on("chatHistory", handleChatHistory);
    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("chatHistory", handleChatHistory);
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [socket, showChat, userName]);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied!!");

    setTimeout(() => {
      setCopySuccess("");
    }, 2000);
  };

  const handleLanguageChange = (e) => {
    const doc = collaborationRef.current?.doc;
    if (!doc) return;

    doc.getMap("meta").set("language", e.target.value);
  };

  return (
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
        <option value="c">C</option>
        <option value="python">Python</option>
        <option value="php">PHP</option>
      </select>

      <button className="leave-button" onClick={leaveRoom}>
        Leave Room
      </button>

      <button className="chat-button" onClick={() => setShowChat(true)}>
        💬 Chat
        {unreadMessages > 0 && (
          <span className="chat-badge">{unreadMessages}</span>
        )}
      </button>

      {showChat && (
        <Chat
          onClose={() => {
            setShowChat(false);
            setUnreadMessages(0);
          }}
          socket={socket}
          roomId={roomId}
          userName={userName}
          messages={messages}
        />
      )}
    </div>
  );
};

export default RoomSidebar;
