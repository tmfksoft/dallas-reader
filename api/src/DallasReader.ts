import fs from 'fs';
import DallasKey from './interfaces/DallasKey';
import * as iButton from './iButton';
import { Gpio } from 'onoff';
import EventEmitter from 'events';


class DallasReader {
	private checkInterval: NodeJS.Timer;
	public connectedDevices: { [key: string]: DallasKey } = {};
	private statusLed: Gpio;
	private events: EventEmitter = new EventEmitter();

	constructor() {
		console.log("Watcher is alive and functioning");
		this.statusLed = new Gpio(17, 'out');
		this.checkInterval = setInterval(this.readDevices.bind(this), 100);

	}

	// Credit: https://stackoverflow.com/a/1981785
	public parseHexString(str: string): number[] { 
		var result: number[] = [];
		// Ignore any trailing single digit; I don't know what your needs
		// are for this case, so you may want to throw an error or convert
		// the lone digit depending on your needs.
		while (str.length >= 2) { 
			result.push(parseInt(str.substring(0, 2), 16));
			str = str.substring(2, str.length);
		}
	
		return result;
	}

	public toHexString(hexArray: number[] | number) {
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
	

	private readDevices() {
		const contents = fs.readdirSync("/sys/bus/w1/devices");
		const currentDevices: string[] = [];
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
			
			const key: DallasKey = {
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
		} else {
			this.statusLed.write(0);
		}
	}

	public on(event: "connect" | "disconnect", listener: (serialNumber: string, key: DallasKey) => void) {
		return this.events.on(event, listener)
	}

	public stop() {
		clearInterval(this.checkInterval);
	}
}
export default DallasReader;