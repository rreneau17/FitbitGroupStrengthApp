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
      actuals: [{}]
    })
    
    // intialize actuals array
    initActuals(actualsObj);

    // display text items
    let exerciseList = document.getElementById("exercise-list");
    let repsGoal = document.getElementById("reps-goal");
    let wgtGoal = document.getElementById("wgt-goal");
    let repLbl = document.getElementById("reps-lable");
    let wgtLbl = document.getElementById("wgt-lable");
    let setsLbl = document.getElementById("sets-lable");
    exerciseList.text = actualsObj.actuals[actualsObj.index].exerciseName;
    repsGoal.text = actualsObj.actuals[actualsObj.index].actualReps;
    wgtGoal.text = actualsObj.actuals[actualsObj.index].actualWgt;
    repLbl.text = "rp:";
    wgtLbl.text = "wt:";
    setsLbl.text = actualsObj.actuals[actualsObj.index].setNum + " / " + actualsObj.actuals[actualsObj.index].sets;

    // button variables
    let btnBR = document.getElementById("btn-br");
    let btnBL = document.getElementById("btn-bl");
    let btnTR = document.getElementById("btn-tr");
    let btnRepMinus = document.getElementById("btn-rep-minus");
    let btnRepPlus = document.getElementById("btn-rep-plus");
    let btnWgtMinus = document.getElementById("btn-wgt-minus");
    let btnWgtPlus = document.getElementById("btn-wgt-plus");
  
    // listens for bottom right button press 
    btnBR.onactivate = function(evt) {
      nextExercise(actualsObj, exerciseList, repsGoal);
    }
    
    // bottom left button - moves backward to previous exercise
    btnBL.onactivate = function(evt) {
      prevExercise(actualsObj, exerciseList, repsGoal);
    }
    
    // top right button - submits actuals data and exits program
    btnTR.onactivate = function(evt) {
      console.log('Top Right!');
    }
    
    // minus button - subtracts 1 from reps goal
    btnRepMinus.onactivate = function(evt) {
      console.log("Minus!")
      
      
    }
    
    // plus button - add 1 to reps goal
    btnRepPlus.onactivate = function(evt) {
      addReps(actualsObj);
    }
}

// intializes actuals array 
function initActuals(actualsObj) {
  let k = 0;
  for(var i = 0; i < actualsObj.exercises.length; i++) {
    for(var n=1; n <= actualsObj.exercises[i].sets; n++) {
        actualsObj.actuals[k] = {
          exerciseName: actualsObj.exercises[i].exerciseName,
          setNum: n,
          sets: actualsObj.exercises[i].sets,
          actualReps: actualsObj.exercises[i].reps,
          actualWgt: actualsObj.exercises[i].weight
        };
        k++;
    }
  }
}

// moves forward to next exercise 
function nextExercise(actualsObj) {
    console.log('Bottom Right!')    
    if(actualsObj.index < actualsObj.actuals.length) {
      actualsObj.index++;
    } else {
      exerciseList.text = "End of List";
    }
}

// moves backward to previous exercise
function prevExercise(actualsObj, exerciseList, repsGoal) {
    console.log('Bottom Left!')
    actualsObj.index--;
    if(actualsObj.index < actualsObj.actuals.length && actualsObj.index >= 0) {
      exerciseList.text = actualsObj.actuals[actualsObj.index].exerciseName;
    } else {
      exerciseList.text = "End of List";
    }
}

function addReps(actualsObj, repsGoal) {
    console.log("Plus!")
    let repsGoal = document.getElementById("reps-goal");
    if (actualsObj.actuals[actualsObj.index].actualReps == null) {
     actualsObj.actuals[actualsObj.index].actualReps = actualsObj.exercises[actualsObj.index].reps;
    } 
    actualsObj.actuals[actualsObj.index].actualReps++;
    repsGoal.text = actualsObj.actuals[actualsObj.index].actualReps;
}

















