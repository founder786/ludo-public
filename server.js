const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.get("/", (req, res) => {
  res.send("🔥 4 Player Ludo Multiplayer Server Running 🔥");
});

let players = [];
let currentTurn = 0;

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  if (players.length < 4) {
    players.push(socket.id);
    socket.emit("player-number", players.length);
    io.emit("players-update", players.length);

    if (players.length === 4) {
      io.emit("start-game");
      io.to(players[currentTurn]).emit("your-turn");
    }
  } else {
    socket.emit("room-full");
  }

  socket.on("roll-dice", () => {
    if (socket.id === players[currentTurn]) {
      const dice = Math.floor(Math.random() * 6) + 1;

      io.emit("dice-result", {
        player: currentTurn + 1,
        value: dice
      });

      currentTurn = (currentTurn + 1) % players.length;
      io.to(players[currentTurn]).emit("your-turn");
    }
  });

  socket.on("disconnect", () => {
    players = players.filter(id => id !== socket.id);
    currentTurn = 0;
    io.emit("player-left");
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running...");
});
