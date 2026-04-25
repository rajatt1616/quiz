const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static(".")); // serve your HTML file

let sessions = {};

io.on("connection", (socket) => {

  socket.on("create-session", (code) => {
    sessions[code] = {
      participants: [],
      scores: {},
      answers: {}
    };
    socket.join(code);
  });

  socket.on("join-session", ({ code, name }) => {
    if (!sessions[code]) return;

    sessions[code].participants.push(name);
    socket.join(code);

    io.to(code).emit("participants-update", sessions[code].participants);
  });

  socket.on("send-question", ({ code, question }) => {
    sessions[code].answers = {};
    io.to(code).emit("new-question", question);
  });

  socket.on("submit-answer", ({ code, name, answer }) => {
    sessions[code].answers[name] = answer;
  });

  socket.on("end-question", ({ code, correct }) => {
    const answers = sessions[code].answers;
    const scores = sessions[code].scores;

    Object.keys(answers).forEach(name => {
      if (answers[name] === correct) {
        scores[name] = (scores[name] || 0) + 1000;
      }
    });

    io.to(code).emit("question-result", {
      correct,
      scores
    });
  });

});

server.listen(3000, "0.0.0.0", () => {
  console.log("Server running on http://0.0.0.0:3000");
});