"use strict";
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
const DallasReader_1 = __importDefault(require("./DallasReader"));
const nes_1 = __importDefault(require("@hapi/nes"));
class ReaderWeb {
    constructor() {
        this.HttpServer = new hapi_1.default.Server({
            port: 8080
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
                path: "/api/v1/ws",
                options: {
                    id: "devices",
                    handler: (request, h) => {
                        return "Ok";
                    }
                }
            });
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Registering plugins");
            yield this.HttpServer.register(nes_1.default);
            console.log("Registering Routes");
            yield this.registerRoutes();
            console.log("Starting HTTPD");
            yield this.HttpServer.start();
            console.log("Ready!");
        });
    }
}
const web = new ReaderWeb();
web.start();
