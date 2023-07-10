const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const cors = require("cors");

app.use(cors());

const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "http://127.0.0.1:5173",
        methods: ["GET", "POST"]
    }
});

let onlineUsers = 0;
let duration = 10;

const logicTimer = () => {
    const startTimer = setInterval(() => {
        console.log(duration);
        duration -= 1;
        if (duration === 0) {
            clearInterval(startTimer);
            duration = 10;
        }
        else {
            return duration;
        }
    }, 1000)
}

io.on("connection", (socket) => {
    let tempname;
    socket.emit("get id", socket.id);

    // Joining a room
    socket.on("join room", (data) => {
        onlineUsers += 1;
        socket.join(data.roomID); // Join the specified room
        socket.to(data.roomID).emit("room message", `${data.username} joins the room`);
        tempname = data.username;
        io.to(data.roomID).emit("get online", onlineUsers);

        // start timer
        socket.on("start timer", () => {
            const startTimer = setInterval(() => {
                console.log(duration);
                io.to(data.roomID).emit("recieve start", duration);

                if (duration === 0) {
                    clearInterval(startTimer);
                    duration = 10;
                }
                else {
                    duration -= 1;
                }
            }, 1000)
        })

        socket.on("disconnect", () => {
            io.to(data.roomID).emit("user left", tempname + " left the chat");
            onlineUsers -= 1;
            io.to(data.roomID).emit("get online", onlineUsers);
        })


    });

    socket.on("user message", (data) => {
        let currentTime = new Date();
        let hours = currentTime.getHours();
        let minutes = currentTime.getMinutes();
        let meridiem = "AM";
        if (hours >= 12) {
            meridiem = "PM";
            if (hours > 12) {
                hours -= 12;
            }
        }
        let time = hours + ":" + (minutes < 10 ? "0" : "") + minutes + " " + meridiem;

        const dataToSend = {
            message: data.message,
            sender: data.sender,
            time: time
        }
        io.to(data.roomID).emit("messages", dataToSend);
    })

})










// io.on('connection', (socket) => {
//     console.log(socket.client);
//     socket.on('chat message', (msg) => {
//         io.emit("chat message", ` ${msg}`);
//     });
//     socket.on("typing", () => {
//         socket.broadcast.emit("typing");
//     })
//     socket.on("stop typing", () => {
//         socket.broadcast.emit("stop typing");
//     })
//     socket.on("username", (getUsername) => {
//         socket.broadcast.emit("username", getUsername)
//     })
// });



server.listen("3000");