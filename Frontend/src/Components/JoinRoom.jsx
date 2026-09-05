const JoinRoom = ({
  roomId,
  setRoomId,
  userName,
  setUserName,
  joinRoom,
}) => {
  const createRoomId = () => {
    const id = Math.floor(10000000 + Math.random() * 90000000);
    setRoomId(id.toString());
  };
  return (
    <div className="join-container">
      <form className="join-form" onSubmit={joinRoom}>
        <h1>Join Code Room</h1>

        <input
          type="text"
          placeholder="Enter the Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <button
          type="button"
          onClick={createRoomId}
          className="random-room-btn"
        >
          Create Random Room ID
        </button>

        <input
          type="text"
          placeholder="Enter your Name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />

        <button type="submit">Join Room</button>
      </form>
    </div>
  );
};

export default JoinRoom;
