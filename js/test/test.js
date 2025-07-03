import { DatabaseManagerTest } from "./database_manager.test.js";

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('database_manager').addEventListener('click', function() {
        database_manager();
    });
});

function print(text) {
    document.getElementById('logTextarea').innerHTML += `<span style="color: green;">${text}</span><br>`;
}

function printError(text) {
    document.getElementById('logTextarea').innerHTML += `<span style="color: red;">${text}</span><br>`;
}

function database_manager() {
    new DatabaseManagerTest(
        (text) => print(`Database Manager Test: ${text}`), 
        (text) => printError(`Database Manager Test: ${text}`)
    ).testAll();
}