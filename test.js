const exec = require("child_process").exec;

let ID = "";
const image = "compiler2";
const file = "code/main.py";
(async () => {
    await new Promise((resolve, reject) => {
        exec("docker create " + image + " python3 main.py", (err, stdout, stderr) => {
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
    console.log(ID);
    await new Promise((resolve, reject) => {
        console.log("idk");
        exec("docker start -a " + ID, { timeout: 200 }, (err, stdout, stderr) => {
            console.log("hihi");
            if (err) {
                console.error(err, stderr);
                console.log("hereee");
                if (err.signal == "SIGTERM") {
                    console.log("timeout");
                } else {
                    // res.send(JSON.stringify({ "stderr": stderr, "err": err }));
                }
                resolve(err);
            } else {
                console.log(stdout);
                // res.send(JSON.stringify({ "stdout": stdout, "stderr": stderr }));
                resolve(stdout);
            }
        });
    });
}) ();
