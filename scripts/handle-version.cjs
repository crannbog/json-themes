/* eslint-disable @typescript-eslint/no-var-requires */
const { exec } = require("child_process");
const readline = require("readline");
const pkg = require("../package.json");

const allowed = [
    "major", "minor", "patch", "premajor", "preminor", "prepatch", "prerelease", "current"
];

const rl = readline.createInterface({
    input:  process.stdin,
    output: process.stdout
});

rl.question(`Type of new version: ${allowed.join(" | ")}\nversion: `, res => {
    if(allowed.includes(res)) {
        const vers = res === "current" ? pkg.version : res;

        exec(`npm version ${vers} --allow-same-version`, (_err, stdout, stderr) => {
            console.log(stdout);

            if(stderr) {
                console.error(stderr);
                throw Error(`Error increasing version ${vers}, cancelling...`);
            }
        });
        rl.close();
    } else
        throw Error("Did not match any of the allowed versions");

    rl.close();
});
