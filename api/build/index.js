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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hapi_1 = __importDefault(require("@hapi/hapi"));
const inert_1 = __importDefault(require("@hapi/inert"));
const DallasReader_1 = __importDefault(require("./DallasReader"));
const ws_1 = __importDefault(require("ws"));
const path = __importStar(require("path"));
class ReaderWeb {
    constructor() {
        this.HttpServer = new hapi_1.default.Server({
            port: 8080
        });
        this.WSServer = new ws_1.default.Server({
            server: this.HttpServer.listener,
            path: "/api/v1/ws"
        });
        this.reader = new DallasReader_1.default();
    }
    registerRoutes() {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    broadcast(event, data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let client of this.WSServer.clients) {
                client.send(JSON.stringify({
                    event, data
                }));
            }
        });
    }
    registerListeners() {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Registering plugins");
            yield this.HttpServer.register(inert_1.default);
            console.log("Registering Routes");
            yield this.registerRoutes();
            console.log("Registering Listeners");
            yield this.registerListeners();
            console.log("Starting HTTPD");
            yield this.HttpServer.start();
            console.log("Ready!");
        });
    }
}
const web = new ReaderWeb();
web.start();
