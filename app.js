const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const fs = require("fs");
const exec = require("child_process").exec;
const util = require("util");

const ext = {
    "C": "c",
    "C++": "cpp",
    "haskell": "hs",
    "java": "java",
    "javascript": "js",
    "python": "py",
    "shell": "sh",
};

const runCom = {
    "C": "/bin/bash -c 'gcc main.c && ./a.out'",
    "C++": "/bin/bash -c 'g++ main.cpp && ./a.out'",
    "haskell": "runghc main.hs",
    "java": "/bin/bash -c 'javac main.java $$ java main'",
    "javascript": "node main.js",
    "python": "python3 main.py",
    "shell": "./main.sh",
};

const image = "compiler2";
// docker build -t compiler .

app.use(express.static(path.join(__dirname, "public"), { index: false }));
app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/main.html"));
});

app.get("/chat", (req, res) => {
    res.sendFile(path.join(__dirname, "public/chat.html"));
});

app.get("/login", (req, res) => {
    if (links.has(req.query.id)) {
        res.sendFile(path.join(__dirname, "public/login.html"));
    } else {
        res.sendFile(path.join(__dirname, "public/invalid.html"));
    }
});

let userList = {};
let links = new Set();
let codeText = {};

io.on("connection", (socket) => {
    socket.on("user join", (user, id) => {
        socket.join(id);
        userList[id][socket.id] = user;
        io.to(id).emit("edit", codeText[id], { line: 1, ch: 1 });
        io.to(id).emit("user join", user);
    });
    socket.on("disconnect", () => {
        for (const [id, room] of Object.entries(userList)) {
            if (room.hasOwnProperty(socket.id)) {
                io.to(id).emit("user leave", room[socket.id]);
                delete room[socket.id];
                if (Object.keys(room).length === 0) {
                    delete codeText[id];
                    links.delete(id);
                    delete userList[id];
                }
                break;
            }
        }
    });
    socket.on("chat message", (msg, id) => {
        io.to(id).emit("chat message", userList[id][socket.id], msg);
    });
    socket.on("edit", (newCode, cursor, id) => {
        codeText[id] = newCode;
        io.to(id).emit("edit", codeText[id], cursor);
    });
    socket.on("new link", () => {
        let randomID = Math.random().toString(36).slice(2);
        if (links.has(randomID)) {
            let randomID = Math.random().toString(36).slice(2);
        }
        userList[randomID] = {};
        links.add(randomID);
        codeText[randomID] = "print('hello')";
        io.emit("new link", "?id=" + randomID);
    });
});

app.get("/userList", (req, res) => {
    res.send(JSON.stringify({ "userList": userList }));
});

app.post("/run", async (req, res) => {
    const { code, lang } = req.body
    const file = "code/main." + ext[lang];
    fs.writeFile(file, code, (err) => {
        if (err) {
            console.error("Error writing file:\n" + err);
        }
    });
    let ID = "";
    await new Promise((resolve, reject) => {
        exec("docker create " + image + " " + runCom[lang], (err, stdout, stderr) => {
            if (err) {
                console.error("Error creating docker container:\n" + err);
                resolve(err);
            } else {
                ID = stdout.trim();
                resolve(stdout);
            }
        });
    });
    await new Promise((resolve, reject) => {
        exec("docker cp " + file + " " + ID + ":/", (err, stdout, stderr) => {
            if (err) {
                console.error("Error copying file into container:\n" + err);
                resolve(err);
            } else {
                resolve(stdout);
            }
        });
    });
    await new Promise((resolve, reject) => {
        let timeDone = false;
        const timer = setTimeout(() => {
            timeDone = true;
            res.send(JSON.stringify({ "timer": "timer" }));
            resolve("Time Exceeded");
        }, 10000);
        exec("docker start -a " + ID, (err, stdout, stderr) => {
            if (!timeDone) {
                clearTimeout(timer);
                if (err) {
                    res.send(JSON.stringify({ "stderr": stderr, "err": err }));
                    resolve(err);
                } else {
                    res.send(JSON.stringify({ "stdout": stdout, "stderr": stderr }));
                    resolve(stdout);
                }
            }
        });
    });
    await new Promise((resolve, reject) => {
        exec("docker stop " + ID, (err, stdout, stderr) => {
            if (err) {
                console.error("Error stopping container:\n" + stderr);
                resolve(err);
            } else {
                resolve(stdout);
            }
        });
    });
    await new Promise((resolve, reject) => {
        exec("docker rm " + ID, (err, stdout, stderr) => {
            if (err) {
                console.error("Error removing container:\n" + stderr);
                resolve(err);
            } else {
                resolve(stdout);
            }
        });
    });
});

http.listen(3000, () => {
    console.log("listening on *:3000");
});

