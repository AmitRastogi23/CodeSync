import { useState, useEffect, useRef } from "react";
import "./Chat.css";

const Chat = ({ onClose, socket, roomId, userName, messages }) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom jab naya message aaye
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("sendMessage", {
      roomId,
      message: message.trim(),
    });
    setMessage("");
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>Chat</h3>
        <button className="chat-close-btn" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">No messages yet. Say hi!</div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={
                msg.userName === userName ? "my-message" : "other-message"
              }
            >
              <strong>{msg.userName}</strong>
              <p>{msg.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
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
        <button onClick={sendMessage}>
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};

export default Chat;
