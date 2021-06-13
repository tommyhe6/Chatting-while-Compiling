const socket = io();
const send = document.querySelector("#send-message");
const message = document.querySelector("#message");
const messages = document.querySelector("#messages");
const username = document.querySelector("#username");

const editor = {};
const language = {};
const run = {};
const output = {};
const compiling = {};
for (const type of ["private", "shared"]) {
    editor[type] = document.querySelector("#editor-" + type);
    language[type] = document.querySelector("#language-" + type);
    run[type] = document.querySelector("#run-" + type);
    output[type] = document.querySelector("#output-" + type);
    compiling[type] = document.querySelector("#compiling-" + type);
}

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");
const curUser = window.location.hash.substring(1);
socket.emit("user join", curUser, id);

const code = {};
for (const type of ["private", "shared"]) {
    code[type] = CodeMirror(editor[type], {
    lineNumbers: true,
    mode: "javascript",
    theme: "dracula"
    });
}
code.private.setValue("print('hello')");

send.addEventListener("submit", (e) => {
    e.preventDefault();
    if (message.value) {
        socket.emit("chat message", message.value, id);
        message.value = "";
    }
});


for (const type of ["private", "shared"]) {
    run[type].addEventListener("click", async () => { 
        compiling[type].style.visibility = "visible";
        output[type].textContent = "";
        const res = await fetch("/run", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "code": code[type].getValue(),
                "lang": language[type].value
            })
        });
        received = await res.json();
        if (received.timer) {
            output[type].textContent += "Your program took too long to execute! (> 10sec)";
        } else if (received.err) {
            if (received.err.code == 1) {
                console.log(received.stderr);
                output[type].textContent += "stderr:\n" + received.stderr + "\n";
            } else if (received.err.code== 137) {
                output[type].textContent += "Your program took too much space!";
            }
        } else {
            if (received.stdout) {
                output[type].textContent += "stdout:\n" + received.stdout + "\n";
            } 
            if (received.stderr) {
                output[type].textContent += "stderr:\n" + received.stderr + "\n";
            }
        }
        compiling[type].style.visibility = "hidden";
    });
}

editor.shared.addEventListener("keyup", (e) => {
    socket.emit("edit", code.shared.getValue(), code.shared.getCursor(), id);
});

socket.on("edit", (codeText, cursor) => {
    code.shared.setValue(codeText);
    code.shared.setCursor(cursor);
});

socket.on("chat message", (user, msg) => {
    let newMsg = document.createElement("li");
    if (user == curUser) {
        newMsg.className = "message-me";
        newMsg.textContent = msg;
    } else {
        newMsg.className = "message-other";
        newMsg.textContent = user + ": " + msg;
    }
    messages.appendChild(newMsg);
    messages.scrollTop = newMsg.offsetHeight + newMsg.offsetTop;
});

socket.on("user join", (user) => {
    let userJoin = document.createElement("div");
    let wrapper = document.createElement("li");
    wrapper.appendChild(userJoin);
    userJoin.className = "user-change";
    wrapper.className = "change-wrapper";
    userJoin.textContent = user + " has joined"
    messages.appendChild(wrapper);
    messages.scrollTop = wrapper.offsetHeight + wrapper.offsetTop;
});

socket.on("user leave", (user) => {
    let userLeave = document.createElement("div");
    let wrapper = document.createElement("li");
    wrapper.appendChild(userLeave);
    userLeave.className = "user-change";
    wrapper.className = "change-wrapper";
    userLeave.textContent = user + " has left"
    messages.appendChild(wrapper);
    messages.scrollTop = wrapper.offsetHeight + wrapper.offsetTop;
});

window.onbeforeunload = () => {
    window.setTimeout(() => {
        window.location.href = "/";
    }, 0);
    window.onbeforeunload = null;
}
