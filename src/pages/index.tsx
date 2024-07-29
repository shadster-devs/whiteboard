import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { useRouter } from 'next/router';
import Whiteboard from '../components/Whiteboard';
import styles from '../styles/Home.module.scss';

const socket: Socket = io();

const Home = () => {
  const router = useRouter();
  const { room: roomName } = router.query;

  const [room, setRoom] = useState<string>(roomName as string || '');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [joined, setJoined] = useState<boolean>(false);
  const [color, setColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(2);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleAuthentication = async (action: 'create' | 'join') => {
    if (!username || !room || !password) {
      setError('Please fill all fields');
      return;
    }
    try {
      const response = await axios.post('/api/auth', { action: action, username: username, room: room, password:password });
      console.log(response);
      if (response.data.success) {
        if (action === 'create') {
          console.log("create room");
          socket.emit('createRoom', { room, username, password });
          setIsHost(true);
        } else {
          socket.emit('joinRoom', { room, username , password});
          setIsHost(false);
        }
        setJoined(true);
        setError('');
      } else {
        setError(response.data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error(error);
      setError('An error occurred during authentication');
    }
  };

  useEffect(() => {
    if (roomName) {
      setRoom(roomName as string);
    }
  }, [roomName]);

  return (
      <div className={styles.container}>
        {!joined ? (
            <div className={styles.joinRoom}>
              <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Enter room name"
              />
              <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
              />
              <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
              />
              <button onClick={() => handleAuthentication('create')}>Create Room</button>
              <button onClick={() => handleAuthentication('join')}>Join Room</button>
              {error && <p>{error}</p>}
            </div>
        ) : (
            <div style={{height:"100%", width :"100%"}}>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
              <input
                  type="range"
                  min="1"
                  max="10"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
              />
              <Whiteboard socket={socket} room={room} username={username} color={color} brushSize={brushSize} isHost={isHost} />
            </div>
        )}
      </div>
  );
};

export default Home;
