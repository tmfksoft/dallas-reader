import React, { useEffect, useMemo, useRef, useState } from 'react';
import DallasKey from './interfaces/DallasKey';
import WSEvent from './interfaces/WSEvent';

interface PageState {
	connectedDevices: { [key: string]: DallasKey },
	knownDevices: DallasKey[],
}

export default function App() {
	const [state, setState] = useState<PageState>({
		connectedDevices: {},
		knownDevices: [],
	});
	
	const ws = useRef<WebSocket>(
		new WebSocket("ws://" + location.hostname + ":8080/api/v1/ws")
	);

	const deviceIsConnected = useMemo(() => {
		return ( Object.keys(state.connectedDevices).length > 0 ? true : false );
	}, [ state.connectedDevices ]);

	const currentDevice = useMemo(() => {
		const vals = Object.values(state.connectedDevices);
		if (vals.length <= 0) {
			return null;
		}
		return vals[0];
	}, [ state.connectedDevices ]);

	const gotMessage = (ev: MessageEvent<any>) => {
		try {
			const keyEvent: WSEvent = JSON.parse(ev.data);

			console.log(keyEvent);

			if (keyEvent.event == "connect") {
				setState(s => ({
					connectedDevices: { ...s.connectedDevices, [keyEvent.data.serial]: keyEvent.data.key },
					knownDevices: [ ...s.knownDevices, keyEvent.data.key ],
				}));
			} else {
				setState(s => {
					const conn = { ...s.connectedDevices };
					delete conn[keyEvent.data.serial];
					return {
						...s,
						connectedDevices: conn,
					};
				});
			}

		} catch (e) {
			console.log("Failed to parse WS message!");
		}
	};

	const toHexString = (hexArray: number[] | number) => {
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

	useEffect(() => {
		console.log("Page render");

		if (ws.current) {
			ws.current.addEventListener("message", gotMessage);
		}

		return () => {
			if (ws.current) {
				ws.current.removeEventListener("message", gotMessage);
			}
		}

	}, []);

	return (
		<>
			<h1>Dallas Reader</h1>
			{deviceIsConnected && <h2>Dallas Key Read {currentDevice?.fullSerial}</h2>}
			{!deviceIsConnected && <h2>Awaiting Key</h2>}
			<h3>Previously scanned keys</h3>
			<table>
				<thead>
					<tr>
						<th colSpan={10}>Serial</th>
					</tr>
				</thead>
				{state.knownDevices.map( (device, ind) => {
					return (
						<tr key={ind}>
							<td style={{ color: "green", textAlign: "right" }}>{toHexString(device.crc)}</td>
							{device.serialNumber.map( (num, ind) => {
								return (
									<td key={ind} style={{ textAlign: "center" }}>{toHexString(num)}</td>
								);
							} )}
							<td style={{ color: "red", textAlign: "left"}}>{toHexString(device.familyCode)}</td>
						</tr>
					);
				})}
			</table>
		</>
	);
}