const socket = io();
const login = document.querySelector("#login-form");
const username = document.querySelector("#username");

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");

login.addEventListener("submit", async (e) => {
    e.preventDefault();
    const res = await fetch("/userList", {
        headers: {
            "Content-Type": "application/json"
        }
    });
    const received = await res.json();
    const userList = received.userList;
    if (username.value) {
        if (userList[id] != null && Object.values(userList[id]).indexOf(username.value) != -1) {
            alert("username taken!");
        } else {
            window.location.href = "/chat?id=" + id + "#" + username.value;
        }
    } 
});

