import DallasKey from "./DallasKey"

export default interface WSEvent {
	event: "connect" | "disconnect",
	data: {
		serial: string,
		key: DallasKey,
	}
}