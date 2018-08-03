// index.js - runs on companion (mobile phone) device

var messaging = require('messaging');
import { url } from './config.js';
import { outbox } from "file-transfer";

let destFilename = "activeRtn.txt";

// get request to backend server to retrieve the active routine
function queryRoutine() {
  fetch(url)     
  .then(function (response) {
      // We need an arrayBuffer of the streamed file contents
      return response.arrayBuffer();
    }).then(function (data) {
        // Queue the file for transfer
        outbox.enqueue(destFilename, data).then(function (ft) {
        // Queued successfully
        console.log("Transfer of '" + destFilename + "' successfully queued.");
      }).catch(function (error) {
         // Failed to queue
        throw new Error("Failed to queue '" + destFilename + "'. Error: " + error);
      });
    }).catch(function (error) {
      // Log error with streaming the file contents
      console.log("Failure: " + error);
    });
}

// posts the actuals workout data to the backend server
function addWorkout(actualsData) {
    console.log('posting data...');
    fetch(url, {
        method: "post",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: actualsData
    }) 
    .then( (response) => { 
        console.log('Posted items.');
        if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        // Send a command to the app to exit the program
          messaging.peerSocket.send({
            command: 'exitProg'
          });
        }
    });
}

// Sends the routine data to the device via message
function returnRoutine(data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send a command to the device
    messaging.peerSocket.send(data);
  } else {
    console.log("Error: Connection is not open");
  }
}

// provides information as to whether there is a connection with app
// setInterval(function () {
//    console.log("Starter app running - Connectivity status=" + messaging.peerSocket.readyState + "Connected? " + (messaging.peerSocket.OPEN ? "YES" : "NO"));
//  }, 3000);

// Listen for onopen event
messaging.peerSocket.onopen = function () {
    console.log("Companion socket is open.")
};

// Listen for onerror event
messaging.peerSocket.onerror = function (err) {
    console.log("Connection error: " + err.code + " - " + err.message);
};

// Listen for messages from the device
let actualsData ='';
messaging.peerSocket.onmessage = function(evt) {  
  if (evt.data && evt.data.command == "getRoutine") {
    // The device requested routine data
    console.log('Companion received request for routine data!');
    queryRoutine();
  } else {
    // console.log("data " + evt.data);
    actualsData += evt.data;
  }
  if (evt.data && evt.data.command == "sendActuals") {
    // The device requested to submit actuals
    console.log('Companion received submit request!');
    console.log(actualsData);
    // extracts [object Object] from data file
    let newActuals = actualsData.replace(/\[object Object\]/gi, '');
    // console.log(newActuals);
    addWorkout(newActuals);
  }
}
