/*
  renderer.js
*/
const { ipcRenderer } = require('electron');
const { SerialPort } = require("serialport");


let serialport = null;

///document.addEventListener('DOMContentLoaded', () => {
// DOM elements
const refreshBtn = document.querySelector(".refresh");
const portSelect = document.getElementById("port");
const baudrateSelect = document.getElementById("baudrate");
const databitSelect = document.getElementById("databit");
const stopbitSelect = document.getElementById("stopbit");
const paritySelect = document.getElementById("parity");
const flowcontrolSelect = document.getElementById("flowcontrol");
const connectBtn = document.getElementById("connect");
const exitBtn = document.getElementById("exit");
const clearBtn = document.getElementById("rx-clear");
const rxText = document.getElementById("rx-text");
const txInput = document.getElementById("tx-input");
const addCrCheck = document.getElementById("add-cr");
const addLfCheck = document.getElementById("add-lf");
const sendBtn = document.getElementById("send-btn");
const statusIndicator = document.querySelector(".status-indicator");
const statusText = document.querySelector(".status span");
const txLed = document.querySelector(".led-icon.tx");
const rxLed = document.querySelector(".led-icon.rx");
const infoText = document.querySelector(".info span");

// State variables
let serialPort = null;
let isConnected = false;
let rxBytes = 0;
let txBytes = 0;
let lastLineHighlightTimeout = null;


// connect/disconnect serial port
connectBtn.addEventListener("click", async function () {
  // Close existing port if open
  if (serialport && serialport.isOpen) {
    await serialport.close();
    serialport.isOpen = false;
    serialport = null;
    connectBtn.textContent = "Connect";
    statusText.textContent = "Ready.";
    isConnected = false;
  }
  const openOptions = {
    path: portSelect.value,
    baudRate: parseInt(baudrateSelect.value),
    dataBits: parseInt(databitSelect.value),
    stopBits: parseFloat(stopbitSelect.value),
    parity: paritySelect.value,
    rtscts: flowcontrolSelect.value === 'hardware',
    xon: flowcontrolSelect.value === 'software',
    xoff: flowcontrolSelect.value === 'software'
  };
  if (!isConnected) {
    serialport = new SerialPort(openOptions, function (err) {
        if (err) {
        statusText.textContent = err.message;
        return console.log("Error: ", err.message);
      }
      saveSettings();

      serialport.on("data", function (data) {
        appendToRxPanel(data);

        blinkRxLed(); // Blink RX LED to indicate data reception
        // Update RX bytes count
        setTimeout(() => rxLed.classList.remove("active"), 200); // Blink effect
      });

      serialport.on("error", function (err) {
        console.error("Serial port error:", err.message);
        statusText.textContent = "Error: " + err.message;
      });

      connectBtn.textContent = "Disconnect";
      statusText.textContent = "Connected: " + serialport.path;
      isConnected = true;
    });
  } else {
    serialport.close();
    connectBtn.textContent = "Connect";
    statusText.textContent = "Ready.";
    isConnected = false;
  }
});

exitBtn.addEventListener("click", () => window.close());

document.getElementById("send-btn").addEventListener("click", () => {
  let data = txInput.value.trim(); // Ensure no leading/trailing spaces
  if (!data) return; // Do nothing if input is empty

  if (addCrCheck.checked) data += "\r";
  if (addLfCheck.checked) data += "\n";

  if (serialport && isConnected) {
    serialport.write(data, function (err) {
      if (err) {
        statusText.textContent = "Error on write: " + err.message;
        return console.error("Error on write: ", err.message);
      }
      // Update status and blink TX LED
      //statusText.textContent = 'Message sent';

      rxText.value += data; // Append the data to the RX area
      //rxText.scrollTop = rxText.scrollHeight; // Scroll to the bottom to ensure the last line is visible
      blinkTxLed(); // Blink TX LED to indicate data transmission
    });
  } else {
    statusText.textContent = "Serial port not connected";
    console.warn("Attempted to send data while serial port is disconnected");
  }
});

refreshBtn.addEventListener('click', ()=> {   
    refreshPorts();
});

clearBtn.addEventListener("click", () => {
  rxText.value = ""; // Clear RX text area
  txInput.value = ""; // Clear TX input field
});

// Port Refresh
async function refreshPorts() {
  try {
    await SerialPort.list().then((ports, err) => {
      if(err) {
        document.getElementById('error').textContent = err.message
        return
      }
      //const ports = await window.serialAPI.listPorts();
      portSelect.innerHTML = '<option value="">Select Port</option>';
      ports.forEach(port => {
        const option = document.createElement('option');
        option.value = port.path;
        option.textContent = `${port.path} ${port.manufacturer ? `(${port.manufacturer})` : ''}`;
        portSelect.appendChild(option);
      });
    })
  } catch (error) {
    console.error('Port refresh error:', error);
  }
}

// Save settings to electron-store
async function saveSettings() {
  const settings = {
    port: portSelect.value,
    baudrate: baudrateSelect.value,
    databit: databitSelect.value,
    stopbit: stopbitSelect.value,
    parity: paritySelect.value,
    flowcontrol: flowcontrolSelect.value,
    cr: addCrCheck.checked,
    lf: addLfCheck.checked,
  };
  //store.set(settings);
  await ipcRenderer.invoke('save-settings', settings).then(() => {
    console.log('settings saved.');
  });
}

// Load settings from electron-store
async function loadSettings() {
  //const settings = store.get();
  const settings = await ipcRenderer.invoke('load-settings');//.then(() => {
  console.log('settings loaded.',settings.databit,settings, settings.databit || 8);
    //console.log('Theme updated successfully!');  });
  if (settings) {
    portSelect.value = settings.port || "";
    baudrateSelect.value = settings.baudrate || "115200";
    databitSelect.value = settings.databit || 8;
    stopbitSelect.value = settings.stopbit || "1";
    paritySelect.value = settings.parity || "none";
    flowcontrolSelect.value = settings.flowcontrol || "none";
    addCrCheck.checked = settings.cr || false;
    addLfCheck.checked = settings.lf !== undefined ? settings.lf : true;
    //databitSelect.value = '5'; // Set default data bits to 5
  }
}

// Append text to RX panel with optional styling
function appendToRxPanel(data, rx = true, isHex = false) {
  if (isHex) {
    const hexString =
      Array.from(data)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join(" ") + " ";
    rxText.value += hexString;
  } else {
    const text = data.toString("utf8"); // Convert Buffer to string
    rxText.value += text;//`Rx:${data.length} ` + text;
  }

  // Scroll to the bottom to ensure the last line is visible
  rxText.scrollTop = rxText.scrollHeight;
}

// Blink TX LED
function blinkTxLed() {
  txLed.classList.add("active");
  setTimeout(() => txLed.classList.remove("active"), 100);
}

// Blink RX LED
function blinkRxLed() {
  rxLed.classList.add("active");
  setTimeout(() => rxLed.classList.remove("active"), 100);
}


refreshPorts().then( ()=> {loadSettings()}); // Load settings after refreshing ports

