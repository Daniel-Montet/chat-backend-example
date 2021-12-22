import "reflect-metadata";
import http from "http"
import express from "express";
import { Server, Socket } from "socket.io"
import cors from "cors";
import { createConnection } from "typeorm";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

// express & SocketIo init
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:3000" } });

// express configs
let whitelist = ["http://localhost:3000"]
let corsOptions = {
	origin: function (origin: any, callback: any) {
		if (whitelist.indexOf(origin) !== -1) {
			callback(null, true)
		} else {
			callback(new Error('Not allowed by CORS'))
		}
	}
}

app.use(cors(corsOptions));

app.get('/', (req, res) => {
	res.send("Hello world");
})


// typeorm initialization
createConnection({
	type: "postgres",
	host: "localhost",
	port: 5432,
	username: "chat",
	password: "chat1234",
	database: "chat",
	entities: [
	],
	synchronize: true,
	logging: false
}).then(connection => {
	console.log("connected to database successfully")
}).catch(error => console.log(error));


io.use((socket: any, next) => {
	const username = socket.handshake.auth.username;
	if (!username) {
		return next(new Error("Invalid username"))
	}
	socket.username = username;
	next()
})


io.on("connection", (socket: any) => {
	let { username } = socket
	console.info(`${username} connected`);
	const users = [];
	for (let [id, socket] of io.of("/").sockets) {
		users.push({
			userID: id,
			username: socket.username,
		});
	}
	socket.emit("users", users);

	socket.on('disconnect', () => {
		console.error(`${username} disconnected`);
	});


})

server.listen(5000, () => {
	console.log('listening on port 3000')
})
