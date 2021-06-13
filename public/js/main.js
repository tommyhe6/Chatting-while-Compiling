const socket = io();
const generate = document.querySelector("#generate-link");
const link = document.querySelector("#link");
const copy = document.querySelector("#clipboard-button");

generate.addEventListener("click", (e) => {
    e.preventDefault();
    socket.emit("new link");
    socket.on("new link", (linkStr) => {
        link.innerText = window.location.href.slice(0, -1) + "/login" + linkStr;
    });
});

copy.addEventListener("click", (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(link.innerText);
});

