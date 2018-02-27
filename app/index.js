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

    let rtnList = JSON.parse(rtnData);

    // object holding routine data, current index, date, and actuals
    let actualsObj = ({
      ...rtnList,
      date: new Date(),
      index: 0,
      actuals: []
    })

    // display text items
    let exerciseList = document.getElementById("exercise-list");
    let repsGoal = document.getElementById("reps-goal");
    exerciseList.text = actualsObj.exercises[actualsObj.index].exerciseName;
    repsGoal.text = actualsObj.exercises[actualsObj.index].reps;

    // button variables
    let btnBR = document.getElementById("btn-br");
    let btnBL = document.getElementById("btn-bl");
    let btnTR = document.getElementById("btn-tr");
    let btnMinus = document.getElementById("btn-minus");
    let btnPlus = document.getElementById("btn-plus");
  
    // bottom right button - moves forward to next exercises
    btnBR.onactivate = function(evt) {
      console.log('Bottom Right!')
      actualsObj.index++;
      if(actualsObj.index < actualsObj.exercises.length) {
        exerciseList.text = actualsObj.exercises[actualsObj.index].exerciseName;
      } else {
        exerciseList.text = "End of List";
      }
    }
    
    // bottom left button - moves backward to previous exercise
    btnBL.onactivate = function(evt) {
      console.log('Bottom Left!')
      actualsObj.index--;
      if(actualsObj.index < actualsObj.exercises.length && actualsObj.index >= 0) {
        exerciseList.text = actualsObj.exercises[actualsObj.index].exerciseName;
      } else {
        exerciseList.text = "End of List";
      }
    }
    
    // top right button - submits actuals data and exits program
    btnTR.onactivate = function(evt) {
      console.log('Top Right!');
    }
    
    // minus button - subtracts 1 from reps goal
    btnMinus.onactivate = function(evt) {
      console.log("Minus!")
    }
    
    // plus button - add 1 to reps goal
    btnPlus.onactivate = function(evt) {
      console.log("Plus!")
    }
}













