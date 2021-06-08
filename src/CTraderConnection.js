const EventEmitter = require("events");
const util = require("util");
const path = require("path");
const { v1 } = require("uuid");
const { CTraderCommandList } = require("./CTraderCommandList");
const { CTraderEncoderDecoder } = require("./CTraderEncoderDecoder");
const { CTraderProtobufReader } = require("./CTraderProtobufReader");
const { CTraderSocket } = require("./CTraderSocket");

class CTraderConnection {
    commandList;
    #encoderDecoder;
    #protobufReader;
    #socket;

    constructor ({ host, port, }) {
        EventEmitter.call(this);

        this.commandList = new CTraderCommandList({ send: (...parameters) => this.send(...parameters), });
        this.#encoderDecoder = new CTraderEncoderDecoder();
        this.#protobufReader = new CTraderProtobufReader([
            { file: path.resolve(__dirname, "../protobuf/OpenApiCommonMessages.proto"), },
            { file: path.resolve(__dirname, "../protobuf/OpenApiMessages.proto"), },
        ]);
        this.#socket = new CTraderSocket({ host, port, });

        this.#encoderDecoder.setDecodeHandler((data) => this.onDecodedData(this.#protobufReader.decode(data)));
        this.#protobufReader.load();
        this.#protobufReader.build();

        this.#socket.onOpen = (...parameters) => this.onOpen(...parameters);
        this.#socket.onData = (...parameters) => this.onData(...parameters);
        this.#socket.onClose = (...parameters) => this.onClose(...parameters);
    }

    getPayloadTypeByName (name) {
        return this.#protobufReader.getPayloadTypeByName(name);
    }

    send (data) {
        this.#socket.send(this.#encoderDecoder.encode(data));
    }

    async sendCommand (payloadType, data) {
        const clientMsgId = v1();
        const message = this.#protobufReader.encode(payloadType, data, clientMsgId);

        return this.commandList.create({ clientMsgId, message, });
    }

    async trySendCommand (payloadType, data) {
        try {
            return await this.sendCommand(payloadType, data);
        }
        catch {
            return undefined;
        }
    }

    open () {
        const connectionPromise = new Promise((resolve, reject) => {
            this._resolveConnectionPromise = resolve;
            this._rejectConnectionPromise = reject;
        });

        this.#socket.connect();

        return connectionPromise;
    }

    onOpen () {
        this._resolveConnectionPromise(true);

        delete this._resolveConnectionPromise;
        delete this._rejectConnectionPromise;
    }

    onData (data) {
        this.#encoderDecoder.decode(data);
    }

    onDecodedData (data) {
        const payloadType = data.payloadType;
        const clientMsgId = data.clientMsgId;
        const sentCommand = this.commandList.extractById(clientMsgId);

        if (sentCommand) {
            CTraderConnection.#onCommandResponse(sentCommand, payloadType, data.payload);
        }
        else {
            this.#onPushEvent(payloadType, data.payload);
        }
    }

    onClose () {
        // Silence is golden.
    }

    sendHeartbeat () {
        this.sendCommand(this.getPayloadTypeByName("ProtoHeartbeatEvent"));
    }

    #onPushEvent (payloadType, message) {
        this.emit(payloadType, message);
    }

    static #onCommandResponse (command, payloadType, message) {
        if (typeof message.errorCode !== "undefined") {
            command.reject(message);
        }
        else {
            command.resolve(message);
        }
    }
}

util.inherits(CTraderConnection, EventEmitter);

module.exports = { CTraderConnection, };
