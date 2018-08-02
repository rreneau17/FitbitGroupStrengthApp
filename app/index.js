// index.js - this program executes on the Fitbit

let document = require("document");
import * as messaging from "messaging";
import { inbox } from "file-transfer";
import * as fs from "fs";
import { me } from "appbit";

// provides information as to whether there is a connection with companion device
//  setInterval(function () {
//    console.log("Starter app running - Connectivity status=" + messaging.peerSocket.readyState + "Connected? " + (messaging.peerSocket.OPEN ? "YES" : "NO"));
//  }, 3000);

// Fetch UI elements 
let exerciseDisp = document.getElementById("exercise-list");
let counter = 0;

hideActuals();
hideCancel();

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

// Listen for message from the companion (mobile phone) that workout was posted
messaging.peerSocket.onmessage = function(evt) {
  if (evt.data && evt.data.command == "exitProg") {
    console.log('Companion received request to exit program!');
    let exerciseList = document.getElementById("exercise-list");
    exerciseList.style.display = "inline";
    exerciseList.text = "data posted!"; 
    me.exit();
  }
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
}



// Event occurs when new routine file(s) are received
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
      userId: rtnList.userId,
      routineId: rtnList.routineId,
      date: new Date(),
      index: 0,
      actuals: [{}]
    })
    
    // intialize actuals array
    initActuals(actualsObj);  
    
    showActuals();
  
    // button variables
    let btnBR = document.getElementById("btn-br");
    let btnBL = document.getElementById("btn-bl");
    let btnTR = document.getElementById("btn-tr");
    let btnRepMinus = document.getElementById("btn-rep-minus");
    let btnRepPlus = document.getElementById("btn-rep-plus");
    let btnWgtMinus = document.getElementById("btn-wgt-minus");
    let btnWgtPlus = document.getElementById("btn-wgt-plus");
    let btnCancel = document.getElementById("btn-cancel");
    let btnEnd = document.getElementById("btn-end");
    let postMsg = document.getElementById("post-msg");
    let postMsg2 = document.getElementById("post-msg2");
    
    // hide exit question buttons and message
    btnCancel.style.display = "none";
    btnEnd.style.display = "none";
    postMsg.style.display = "none";
    postMsg2.style.display = "none";
  
    displayItems(actualsObj);
  
    // listens for bottom right button press 
    btnBR.onactivate = function(evt) {
      nextExercise(actualsObj);
    }
    
    // bottom left button - moves backward to previous exercise
    btnBL.onactivate = function(evt) {
      prevExercise(actualsObj);
    }
    
    // top right button - submits actuals data and exits program
    btnTR.onactivate = function(evt) {
      console.log('Top Right!');
      hideActuals();
      btnCancel.style.display = "inline";
      btnEnd.style.display = "inline";
      // need to refactor the text to textarea in the future
      postMsg.style.display = "inline";
      postMsg.text = "Do you want to post";
      postMsg2.style.display = "inline";
      postMsg2.text = "this workout?";
    }
    
    // minus button - subtracts 1 from reps goal
    btnRepMinus.onactivate = function(evt) {
      subtractReps(actualsObj);  
    }
    
    // plus button - add 1 to reps goal
    btnRepPlus.onactivate = function(evt) {
      addReps(actualsObj);
    }
    
    // subtract 1 from weight goal
    btnWgtMinus.onactivate = function(evt) {
      subtractWgt(actualsObj);        
    }
    
    // add 1 to weight goal
    btnWgtPlus.onactivate = function(evt) {
      addWgt(actualsObj);
    }
    
    // cancels the request to post the data
    btnCancel.onactivate = function(evt) {
      showActuals();
      hideCancel();
    }
    
    // submits actuals to be posted on the backend server
    btnEnd.onactivate = function(evt) {
      
      fileMessage();
      
      submitActuals(actualsObj);

      // Listen for the onbufferedamountdecrease event
      messaging.peerSocket.onbufferedamountdecrease = function() {
      // Amount of buffered data has decreased, continue sending data
        submitActuals(actualsObj);
        console.log('Buffer decrease listener');
      }
    }
}

function submitActuals(actualsObj) {
  let actualsData = JSON.stringify(actualsObj);
  // the actuals must be sent over is small chunks
  if (messaging.peerSocket.bufferedAmount < 512) {
    // Send data only while the buffer contains less than 128 bytes 
    if (counter < actualsData.length) {
      let actualsStr = actualsData.substring(counter, counter + 512);
      if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        counter += 512;
        messaging.peerSocket.send(actualsStr);
        console.log('sending file: ' + counter);
      } 
    } else {
      if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        // Send a command to the companion
          messaging.peerSocket.send({
            command: 'sendActuals'
          });
          messaging.peerSocket.onbufferedamountdecrease = undefined;
      }
    }
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
          orderNum: actualsObj.exercises[i].orderNum,
          sets: actualsObj.exercises[i].sets,
          actualReps: actualsObj.exercises[i].reps,
          actualWgt: actualsObj.exercises[i].weight,
          exerciseId: actualsObj.exercises[i].exerciseId 
        };
        k++;
    }
  }
}

// moves forward to next exercise 
function nextExercise(actualsObj) {
    let exerciseList = document.getElementById("exercise-list");
    if(actualsObj.index < actualsObj.actuals.length) {
      actualsObj.index++;
      displayItems(actualsObj);
    } else {
      exerciseList.text = "End of Session";
    }
}

// moves backward to previous exercise
function prevExercise(actualsObj) {
    console.log('Bottom Left!') 
    if(actualsObj.index < actualsObj.actuals.length && actualsObj.index >= 0) {
      actualsObj.index--;
      displayItems(actualsObj);
    } 
}

// increases rep count
function addReps(actualsObj) {
    console.log("Plus Reps!");
    actualsObj.actuals[actualsObj.index].actualReps++;
    displayItems(actualsObj);
}

// decreases rep count
function subtractReps(actualsObj) {
    console.log("Minus Reps");
    if(actualsObj.actuals[actualsObj.index].actualReps > 0) {
      actualsObj.actuals[actualsObj.index].actualReps--;
    }
    displayItems(actualsObj);
}

// increases weight amount
function addWgt(actualsObj) {
    console.log("Plus Wgt!");
    actualsObj.actuals[actualsObj.index].actualWgt++;
    displayItems(actualsObj);
}

// decreases weight amount
function subtractWgt(actualsObj) {
    console.log("Minus Wgt")
    if(actualsObj.actuals[actualsObj.index].actualWgt > 0) {
      actualsObj.actuals[actualsObj.index].actualWgt--;
    }
    displayItems(actualsObj);
}

// displays text items
function displayItems(actualsObj) {
    let exerciseList = document.getElementById("exercise-list");
    let repsGoal = document.getElementById("reps-goal");
    let wgtGoal = document.getElementById("wgt-goal");
    let repLbl = document.getElementById("reps-label");
    let wgtLbl = document.getElementById("wgt-label");
    let setsLbl = document.getElementById("sets-label");
    exerciseList.text = actualsObj.actuals[actualsObj.index].exerciseName;
    repsGoal.text = actualsObj.actuals[actualsObj.index].actualReps;
    wgtGoal.text = actualsObj.actuals[actualsObj.index].actualWgt;
    repLbl.text = "rp:";
    wgtLbl.text = "wt:";
    setsLbl.text = actualsObj.actuals[actualsObj.index].setNum + " / " + actualsObj.actuals[actualsObj.index].sets;
}

// hides the text items
function hideActuals() {
    let exerciseList = document.getElementById("exercise-list");
    let repsGoal = document.getElementById("reps-goal");
    let wgtGoal = document.getElementById("wgt-goal");
    let repLbl = document.getElementById("reps-label");
    let wgtLbl = document.getElementById("wgt-label");
    let setsLbl = document.getElementById("sets-label");
    let btnBR = document.getElementById("btn-br");
    let btnBL = document.getElementById("btn-bl");
    let btnTR = document.getElementById("btn-tr");
    let btnRepMinus = document.getElementById("btn-rep-minus");
    let btnRepPlus = document.getElementById("btn-rep-plus");
    let btnWgtMinus = document.getElementById("btn-wgt-minus");
    let btnWgtPlus = document.getElementById("btn-wgt-plus");
    exerciseList.style.display = "none";
    repsGoal.style.display = "none";
    wgtGoal.style.display = "none";
    repLbl.style.display = "none";
    wgtLbl.style.display = "none";
    setsLbl.style.display = "none";
    btnBR.style.display = "none";
    btnBL.style.display = "none";
    btnTR.style.display = "none";
    btnRepMinus.style.display = "none";
    btnRepPlus.style.display = "none";
    btnWgtMinus.style.display = "none";
    btnWgtPlus.style.display = "none";
}

// hides the cancel / post screen
function hideCancel() {
    let btnCancel = document.getElementById("btn-cancel");
    let btnEnd = document.getElementById("btn-end");
    let postMsg = document.getElementById("post-msg");
    let postMsg2 = document.getElementById("post-msg2");
    btnCancel.style.display = "none";
    btnEnd.style.display = "none";
    postMsg.style.display = "none";
    postMsg2.style.display = "none";
}

// message displayed when workout data is being posted
function fileMessage() {
    hideCancel();
    let postMsg = document.getElementById("post-msg");
    postMsg.style.display = "inline";
    postMsg.text = "posting data..."; 
}

// diplay the actuals info on screen
function showActuals() {
    let exerciseList = document.getElementById("exercise-list");
    let repsGoal = document.getElementById("reps-goal");
    let wgtGoal = document.getElementById("wgt-goal");
    let repLbl = document.getElementById("reps-label");
    let wgtLbl = document.getElementById("wgt-label");
    let setsLbl = document.getElementById("sets-label");
    let btnBR = document.getElementById("btn-br");
    let btnBL = document.getElementById("btn-bl");
    let btnTR = document.getElementById("btn-tr");
    let btnRepMinus = document.getElementById("btn-rep-minus");
    let btnRepPlus = document.getElementById("btn-rep-plus");
    let btnWgtMinus = document.getElementById("btn-wgt-minus");
    let btnWgtPlus = document.getElementById("btn-wgt-plus");
    exerciseList.style.display = "inline";
    repsGoal.style.display = "inline";
    wgtGoal.style.display = "inline";
    repLbl.style.display = "inline";
    wgtLbl.style.display = "inline";
    setsLbl.style.display = "inline";
    btnBR.style.display = "inline";
    btnBL.style.display = "inline";
    btnTR.style.display = "inline";
    btnRepMinus.style.display = "inline";
    btnRepPlus.style.display = "inline";
    btnWgtMinus.style.display = "inline";
    btnWgtPlus.style.display = "inline";
}






















