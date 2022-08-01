"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const iButton = __importStar(require("./iButton"));
const onoff_1 = require("onoff");
const events_1 = __importDefault(require("events"));
class DallasReader {
    constructor() {
        this.connectedDevices = {};
        this.events = new events_1.default();
        console.log("Watcher is alive and functioning");
        this.statusLed = new onoff_1.Gpio(17, 'out');
        this.checkInterval = setInterval(this.readDevices.bind(this), 100);
    }
    // Credit: https://stackoverflow.com/a/1981785
    parseHexString(str) {
        var result = [];
        // Ignore any trailing single digit; I don't know what your needs
        // are for this case, so you may want to throw an error or convert
        // the lone digit depending on your needs.
        while (str.length >= 2) {
            result.push(parseInt(str.substring(0, 2), 16));
            str = str.substring(2, str.length);
        }
        return result;
    }
    toHexString(hexArray) {
        let hexString = "";
        if (!Array.isArray(hexArray)) {
            hexArray = [hexArray];
        }
        for (let h of hexArray) {
            let hex = h.toString(16);
            if (hex.length === 1) {
                hex = "0" + hex;
            }
            hexString = hexString + hex.toUpperCase();
        }
        return hexString;
    }
    readDevices() {
        const contents = fs_1.default.readdirSync("/sys/bus/w1/devices");
        const currentDevices = [];
        for (let device of contents) {
            // Skip
            if (device.toLocaleLowerCase() === "w1_bus_master1") {
                continue;
            }
            const ex = device.split("-");
            const familyCode = parseInt(ex[0], 16);
            const serialNumber = Array.from(Buffer.from(ex[1], 'hex'));
            const crc = iButton.crc(Buffer.from(ex[1] + ex[0], 'hex'));
            const fullSerial = this.toHexString(familyCode) + this.toHexString(serialNumber) + this.toHexString(crc);
            const key = {
                familyCode,
                serialNumber,
                crc,
                fullSerial,
            };
            if (!this.connectedDevices[fullSerial]) {
                // New Device
                this.connectedDevices[fullSerial] = key;
                console.log(fullSerial, " was connected");
                this.events.emit("connect", fullSerial, key);
            }
            // Add it to the currently detected
            currentDevices.push(fullSerial);
        }
        // Detected disconnected devices
        for (let serial in this.connectedDevices) {
            if (!currentDevices.includes(serial)) {
                // Disconnected
                const key = this.connectedDevices[serial];
                console.log(serial, " was disconnected");
                this.events.emit("disconnect", serial, key);
                delete this.connectedDevices[serial];
            }
        }
        // Make the LED reflect the status
        if (currentDevices.length > 0) {
            this.statusLed.write(1);
        }
        else {
            this.statusLed.write(0);
        }
    }
    on(event, listener) {
        return this.events.on(event, listener);
    }
    stop() {
        clearInterval(this.checkInterval);
    }
}
exports.default = DallasReader;
