let document = require("document");
import * as messaging from "messaging";
import { inbox } from "file-transfer";
import * as fs from "fs";

setInterval(function () {
    console.log("Starter app running - Connectivity status=" + messaging.peerSocket.readyState + "Connected? " + (messaging.peerSocket.OPEN ? "YES" : "NO"));
}, 3000);

// Fetch UI elements 
let txtLabel = document.getElementById("myLabel");

function fetchRoutine() {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      // Send a command to the companion
      messaging.peerSocket.send({
        command: 'getRoutine'
      });
    }
  }

// Listen for onopen event
messaging.peerSocket.onopen = function () {
    fetchRoutine();
    // txtLabel.text = 'Hello World!'
};

// Listen for messages from the companion
messaging.peerSocket.onmessage = function(evt) {
  if (evt.data) {
    console.log(evt.data.reps);
    txtLabel.text = evt.data.reps;
  }
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
}

let statusText = document.getElementById("status");
statusText.text = "Waiting...";

// Event occurs when new file(s) are received
inbox.onnewfile = () => {
  console.log("New file!");
  let fileName;
  do {
    // If there is a file, move it from staging into the application folder
    fileName = inbox.nextFile();
    if (fileName) {
      console.log(`Received File: <${fileName}>`);
      let rtnData = fs.readFileSync(fileName, "utf-8");
      // statusText.text = `Received file`;
      displayRtn(rtnData);
    }
  } while (fileName);  
};

function displayRtn(rtnData) {
    let rtnList = JSON.parse(rtnData);
    console.log(rtnList[0].weight);
  }






