let document = require("document");
import * as messaging from "messaging";
import { inbox } from "file-transfer";
import * as fs from "fs";

// provides information as to whether there is a connection with companion device
//  setInterval(function () {
//    console.log("Starter app running - Connectivity status=" + messaging.peerSocket.readyState + "Connected? " + (messaging.peerSocket.OPEN ? "YES" : "NO"));
//  }, 3000);

// Fetch UI elements 
let exerciseDisp = document.getElementById("exercise-list");

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
    console.log('Recieved message from companion');
    // txtLabel.text = evt.data.reps;
  }
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
}



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
    let i = 0;
    let rtnList = JSON.parse(rtnData); 
    let exerciseList = document.getElementById("exercise-list");
    exerciseList.text = rtnList.exercises[i].exerciseName;
    let btnBR = document.getElementById("btn-br");
    let btnBL = document.getElementById("btn-bl");
    let btnTR = document.getElementById("btn-tr")
  
    btnBR.onactivate = function(evt) {
      console.log('Bottom Right!')
      i++;
      if(i < rtnList.exercises.length) {
        exerciseList.text = rtnList.exercises[i].exerciseName;
      } else {
        exerciseList.text = "End of List";
      }
    }
    
    btnBL.onactivate = function(evt) {
      console.log('Bottom Left!')
      i--;
      if(i < rtnList.exercises.length && i >= 0) {
        exerciseList.text = rtnList.exercises[i].exerciseName;
      } else {
        exerciseList.text = "End of List";
      }
    }
    
    btnTR.onactivate = function(evt) {
      console.log('Top Right!');
    }
}

}









