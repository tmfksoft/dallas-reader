import Hapi from '@hapi/hapi';
import Inert from '@hapi/inert';
import DallasReader from './DallasReader';
import WebSocket from 'ws';
import * as path from 'path';

class ReaderWeb {
	private HttpServer: Hapi.Server;
	private reader: DallasReader;
	private WSServer: WebSocket.Server;

	constructor() {
		this.HttpServer = new Hapi.Server({
			port: 8080
		});
		this.WSServer = new WebSocket.Server({
			server: this.HttpServer.listener,
			path: "/api/v1/ws"
		});
		this.reader = new DallasReader();
	}

	async registerRoutes() {
		this.HttpServer.route({
			method: "GET",
			path: "/api/v1/devices",
			handler: (req, h) => {
				return this.reader.connectedDevices;
			}
		});
		this.HttpServer.route({
			method: "GET",
			path: "/{param*}",
			handler: {
				directory: {
					path: path.join(__dirname, "..", "public"),
				}
			}
		});
	}

	async broadcast(event: string, data: any) {
		for (let client of this.WSServer.clients) {
			client.send(JSON.stringify({
				event, data
			}));
		}
	}

	async registerListeners() {
		this.WSServer.on('connection', (socket) => {
			console.log("Got WS conn");
		});
		this.reader.on("connect", (serial, key) => {
			console.log("Broadcasting Connect");
			this.broadcast("connect", { serial, key });
		});
		this.reader.on("disconnect", (serial, key) => {
			console.log("Broadcasting Disconnect");
			this.broadcast("disconnect", { serial, key });
		});
	}

	async start() {
		console.log("Registering plugins");
		await this.HttpServer.register(Inert);

		console.log("Registering Routes");
		await this.registerRoutes();

		console.log("Registering Listeners");
		await this.registerListeners();

		console.log("Starting HTTPD")
		await this.HttpServer.start();

		console.log("Ready!");
	}
}
const web = new ReaderWeb();
web.start();