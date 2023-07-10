import { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import './App.css'

const socket = io.connect("http://localhost:3000/")

function App() {
	const [username, setUsername] = useState("");
	const [joinRoomID, setJoinRoomID] = useState("");

	const [roomUsers, setRoomUsers] = useState([]);
	const [id, setID] = useState("");
	const chatContainerRef = useRef(null);

	const [showChat, setShowChat] = useState(false);
	const [message, setMessage] = useState("");

	const [showDisconnect, setShowDisconnect] = useState(false);
	const [disconnectMsg, setDisconnectMsg] = useState("");

	const [chatPool, setChatPool] = useState([]);
	const [getOnline, setGetOnline] = useState(0);

	const [winner, setWinner] = useState({
		bid: 0,
		username: ""
	});

	const handleJoinRoom = () => {
		socket.emit("join room", {
			username: username,
			roomID: joinRoomID
		});
		setShowChat(true)
	}

	const sendMessage = async () => {
		const sendThisToServer = {
			message: message,
			roomID: joinRoomID,
			sender: username
		}
		await socket.emit("user message", sendThisToServer);
		setMessage("");
	}


	const [time, setTimer] = useState(10);
	const handleTimer = () => {
		socket.emit("start timer");
	}
	useEffect(() => {
		socket.on("get online", data => {
			setGetOnline(data);
		})

		socket.on("user left", data => {
			setShowDisconnect(true);
			setDisconnectMsg(data);
		})

		socket.on("get id", data => {
			setID(data);
		});

		socket.on("room message", (data) => {
			setRoomUsers([...roomUsers, data]);
		});

		socket.on("messages", async (data) => {
			const response = await data;
			setChatPool(prev => [...prev, response]);
		});

		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
		}

		socket.on("recieve start", async(duration) => {
			const response = await duration
			console.log(response);
			setTimer(response)
			// const startTimer = setInterval(() => {
			// 	setTimer(prev => {
			// 		if (Number(prev) === 0) {
			// 			clearInterval(startTimer);
			// 			setTimer(0);
			// 			const getBid = chatPool.map(item => {
			// 				if (Number(item.message) >= winner.bid) {
			// 					setWinner(prev => ({ ...prev, [winner.bid]: Number(item.message) }));
			// 				}
			// 			});
			// 			console.log(getBid);
			// 		} else {
			// 			return prev - 1
			// 		}
			// 	});
			// }, 1000)
		})

		return () => {
			socket.off("room message");
			socket.off("messages");
			socket.off("get id");
			socket.off("user left")
			socket.off("get online")
			socket.off("recieve start");
		};
	}, [[socket, chatPool]]);

	return (
		<div>
			{
				showChat ?
					<>
						<p>Timer: {time}</p>
						<button onClick={handleTimer} disabled={time == 0} className={`${time == 0 ? 'text-red-500' : ''}`}>Start Timer</button>
						<p className='text-red-400 text-center'>{showDisconnect && disconnectMsg}</p>

						<div className='flex flex-col justify-between bg-slate-600 w-96 h-96 relative'>
							<div>
								<div>
									<p>Room ID: {joinRoomID}</p>
									<p className='text-green-400'>Online: {getOnline}</p>
								</div>
								{
									roomUsers.map((item, index) => (
										<p className='text-yellow-400 text-sm' key={index}>{item}</p>
									))
								}
							</div>

							<div
								className='flex flex-col max-h-min overflow-auto mb-14'
								ref={chatContainerRef}
							>
								<div>
									{
										chatPool.map((chat, index) => (
											<div key={index} className='flex max-w-max items-center justify-center'>
												<div className='flex flex-col items-center'>
													<p className='text-slate-400 text-sm'>{chat.sender.charAt(0).toUpperCase() + chat.sender.slice(1)}: </p>
												</div>
												<p className='pl-1'>{chat.message}</p>
											</div>
										))
									}
								</div>
							</div>

							<div className='flex items-center justify-between absolute bottom-0 left-0 w-full p-2'>
								<input
									type="text"
									placeholder='send a message...'
									value={message}
									className='w-full p-2'
									onChange={(e) => {
										setMessage(e.target.value);
									}}
								/>
								<button onClick={sendMessage}>Send</button>
							</div>
						</div>
					</>

					:
					<>
						<div className='flex flex-col gap-4'>
							<div >
								<label>Username</label>
								<input type="text" className='p-2 mx-2' onChange={(e) => {
									setUsername(e.target.value)
								}} />
							</div>
							<div >
								<label>room id</label>
								<input type="text" className='p-2 mx-2' onChange={(e) => {
									setJoinRoomID(e.target.value)
								}} />
							</div>
						</div>
						<br /><br /><br />
						<button onClick={handleJoinRoom}>Join Room</button>
					</>
			}
		</div>
	)
}

export default App
