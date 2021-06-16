import { CTraderCommandMap } from "#commands/CTraderCommandMap";
import * as EventEmitter from "events";
import { CTraderEncoderDecoder } from "#encoder-decoder/CTraderEncoderDecoder";
import { CTraderSocket } from "#sockets/CTraderSocket";
import { CTraderCommand } from "#commands/CTraderCommand";
import { GenericObject } from "#utilities/GenericObject";
import { CTraderProtobufReader } from "#protobuf/CTraderProtobufReader";

const util = require("util");
const path = require("path");
const { v1, } = require("uuid");


export class CTraderConnection extends EventEmitter {
    readonly #commandMap: CTraderCommandMap;
    readonly #encoderDecoder: CTraderEncoderDecoder;
    readonly #protobufReader;
    readonly #socket: CTraderSocket;
    #resolveConnectionPromise?: (...parameters: any[]) => void;
    #rejectConnectionPromise?: (...parameters: any[]) => void;

    public constructor ({ host, port, }: GenericObject) {
        super();

        this.#commandMap = new CTraderCommandMap({ send: (data: any): void => this.send(data), });
        this.#encoderDecoder = new CTraderEncoderDecoder();
        // eslint-disable-next-line max-len
        this.#protobufReader = new CTraderProtobufReader([ { file: path.resolve(__dirname, "../../../protobuf/OpenApiCommonMessages.proto"), }, { file: path.resolve(__dirname, "../../../protobuf/OpenApiMessages.proto"), }, ]);
        this.#socket = new CTraderSocket({ host, port, });
        this.#resolveConnectionPromise = undefined;
        this.#rejectConnectionPromise = undefined;

        this.#encoderDecoder.setDecodeHandler((data) => this.onDecodedData(this.#protobufReader.decode(data)));
        this.#protobufReader.load();
        this.#protobufReader.build();

        this.#socket.onOpen = (): void => this.onOpen();
        this.#socket.onData = (data: any): void => this.onData(data);
        this.#socket.onClose = (): void => this.onClose();
    }

    public getPayloadTypeByName (name: string): number {
        return this.#protobufReader.getPayloadTypeByName(name);
    }

    public send (data: GenericObject): void {
        this.#socket.send(this.#encoderDecoder.encode(data));
    }

    async sendCommand (payloadType: number, data?: GenericObject): Promise<GenericObject> {
        const clientMsgId: string = v1();
        const message: any = this.#protobufReader.encode(payloadType, data ?? {}, clientMsgId);

        return this.#commandMap.create({ clientMsgId, message, });
    }

    async trySendCommand (payloadType: number, data?: GenericObject): Promise<GenericObject | undefined> {
        try {
            return await this.sendCommand(payloadType, data);
        }
        catch {
            return undefined;
        }
    }

    open (): Promise<unknown> {
        const connectionPromise = new Promise((resolve, reject) => {
            this.#resolveConnectionPromise = resolve;
            this.#rejectConnectionPromise = reject;
        });

        this.#socket.connect();

        return connectionPromise;
    }

    onOpen (): void {
        if (this.#resolveConnectionPromise) {
            this.#resolveConnectionPromise();
        }

        this.#resolveConnectionPromise = undefined;
        this.#rejectConnectionPromise = undefined;
    }

    onData (data: Buffer): void {
        this.#encoderDecoder.decode(data);
    }

    onDecodedData (data: GenericObject): void {
        const payloadType = data.payloadType;
        const clientMsgId = data.clientMsgId;
        const sentCommand = this.#commandMap.extractById(clientMsgId);

        if (sentCommand) {
            CTraderConnection.#onCommandResponse(sentCommand, payloadType, data.payload);
        }
        else {
            this.#onPushEvent(payloadType, data.payload);
        }
    }

    onClose (): void {
        // Silence is golden.
    }

    sendHeartbeat (): void {
        this.sendCommand(this.getPayloadTypeByName("ProtoHeartbeatEvent"));
    }

    #onPushEvent (payloadType: number, message: GenericObject): void {
        this.emit(payloadType.toString(), message);
    }

    static #onCommandResponse (command: CTraderCommand, payloadType: number, message: GenericObject): void {
        if (typeof message.errorCode !== "undefined") {
            command.reject(message);
        }
        else {
            command.resolve(message);
        }
    }
}
