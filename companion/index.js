var messaging = require('messaging');
import { url } from './config.js';

function queryRoutine() {
  fetch(url)
  .then(function (response) {
    response.json()
    .then(function(data) {
      var oneRoutine = data[0];
      returnRoutine(oneRoutine);
    });
  })
  .catch(function (err) {
    console.log("Error fetching posts: " + err);
  });
}

function addPost() {
    fetch(url, {
        method: "post",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: "Fourth post from watch",
            content: "Yay!"
        })
    })
    .then( (response) => { 
        console.log('Posted items.')
    });
}

// Send the post data to the device
function returnRoutine(data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send a command to the device
    messaging.peerSocket.send(data);
  } else {
    console.log("Error: Connection is not open");
  }
}

setInterval(function () {
    console.log("Starter app running - Connectivity status=" + messaging.peerSocket.readyState + "Connected? " + (messaging.peerSocket.OPEN ? "YES" : "NO"));
}, 3000);

messaging.peerSocket.onopen = function () {
    console.log("Companion socket is open.")
};
messaging.peerSocket.onerror = function (err) {
    console.log("Connection error: " + err.code + " - " + err.message);
};

// Listen for messages from the device
messaging.peerSocket.onmessage = function(evt) {
  if (evt.data && evt.data.command == "getRoutine") {
    // The device requested weather data
    console.log('Companion received request!');
    queryRoutine();
    // addPost();
  }
}