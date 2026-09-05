import "./App.css";
import io from "socket.io-client";

import EditorWorkspace from "./Components/EditorWorkspace";
import RoomSidebar from "./Components/RoomSidebar";
import JoinRoom from "./Components/JoinRoom";
import VideoCall from "./Components/Call/VideoCall";

import { useRoomState } from "./Hooks/useRoomState";
import { useRoomSocket } from "./Hooks/useRoomSocket";
import { useCollaboration } from "./Hooks/useCollaboration";

const socket = io("http://localhost:5000");
// https://realtime-codeeditor-m65p.onrender.com

const App = () => {
  const { collaborationRef, joinCollaboration } = useCollaboration();
  const {
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
  } = useRoomState();

  useRoomSocket(socket, setUsers, setTyping, collaborationRef);

  const joinRoom = (e) => {
    e.preventDefault();
    if (!roomId || !userName) {
      alert("Please enter Room ID and Name");
      return;
    }
    joinCollaboration(
      roomId,
      () => {
        socket.emit("typing", {
          roomId,
          userName,
        });
      },
      setOutput,
      setlanguage,
    );
    socket.emit("join", { roomId, userName });
    setJoined(true);
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setlanguage("javascript");
  };

  if (!joined) {
    return (
      <JoinRoom
        roomId={roomId}
        setRoomId={setRoomId}
        userName={userName}
        setUserName={setUserName}
        joinRoom={joinRoom}
      />
    );
  }
  return (
    <div className="editor-container">
      <RoomSidebar
        roomId={roomId}
        users={users}
        typing={typing}
        language={language}
        collaborationRef={collaborationRef}
        leaveRoom={leaveRoom}
        socket={socket}
        userName={userName}
      />
      <EditorWorkspace
        collaborationRef={collaborationRef}
        language={language}
        input={input}
        setInput={setInput}
        output={output}
        setOutput={setOutput}
        roomId={roomId}
        socket={socket}
      />
      <VideoCall socket={socket} roomId={roomId} userName={userName} />
    </div>
  );
};

export default App;
