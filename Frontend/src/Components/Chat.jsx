import { useState } from "react";
import "./Chat.css";

const Chat = ({ onClose, socket, roomId, userName, messages }) => {
  const [message, setMessage] = useState("");

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("sendMessage", {
      roomId,
      userName,
      message: message.trim(),
    });
    setMessage("");
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>Chat</h3>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={
              msg.userName === userName ? "my-message" : "other-message"
            }
          >
            <strong>{msg.userName}</strong>
            <p>{msg.message}</p>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
