const protobuf = require("protobufjs");

class CTraderProtobufReader {
    constructor (options) {
        this.params = options;
        this.builder = undefined;
        this.payloadTypes = {};
        this.names = {};
        this.messages = {};
        this.enums = {};
    }

    encode (payloadType, params, clientMsgId) {
        const Message = this.getMessageByPayloadType(payloadType);
        const message = new Message(params);

        return this.wrap(payloadType, message, clientMsgId).encode();
    }

    decode (buffer) {
        const protoMessage = this.getMessageByName("ProtoMessage").decode(buffer);
        const payloadType = protoMessage.payloadType;

        return {
            payload: this.getMessageByPayloadType(payloadType).decode(protoMessage.payload),
            payloadType: payloadType,
            clientMsgId: protoMessage.clientMsgId
        };
    }

    wrap (payloadType, message, clientMsgId) {
        const ProtoMessage = this.getMessageByName("ProtoMessage");

        return new ProtoMessage({
            payloadType: payloadType,
            payload: message.toBuffer(),
            clientMsgId: clientMsgId
        });
    }

    load () {
        this.params.forEach((param) => {
            this.builder = protobuf.loadProtoFile(param.file, this.builder);
        });
    }

    build () {
        const builder = this.builder;

        builder.build();

        const messages = [];
        const enums = [];

        builder.ns.children.forEach((reflect) => {
            const className = reflect.className;

            if (className === "Message") {
                messages.push(reflect);
            } else if (className === "Enum") {
                enums.push(reflect);
            }
        });

        messages.filter((message) => typeof this.findPayloadType(message) === "number").forEach((message) => {
            const name = message.name;
            const messageBuilded = builder.build(name);

            this.messages[name] = messageBuilded;

            const payloadType = this.findPayloadType(message);

            this.names[name] = {
                messageBuilded: messageBuilded,
                payloadType: payloadType,
            };
            this.payloadTypes[payloadType] = {
                messageBuilded: messageBuilded,
                name: name,
            };
        });

        enums.forEach((enume) => {
            const name = enume.name;

            this.enums[name] = builder.build(name);
        });

        this.buildWrapper();
    }

    buildWrapper () {
        const name = "ProtoMessage";
        const messageBuilded = this.builder.build(name);

        this.messages[name] = messageBuilded;
        this.names[name] = {
            messageBuilded: messageBuilded,
            payloadType: undefined,
        };
    }

    findPayloadType (message) {
        const field = message.children.find((field) => field.name === "payloadType");

        if (!field) {
            return undefined;
        }

        return field.defaultValue;
    }

    getMessageByPayloadType (payloadType) {
        return this.payloadTypes[payloadType].messageBuilded;
    }

    getMessageByName (name) {
        return this.names[name].messageBuilded;
    }

    getPayloadTypeByName (name) {
        return this.names[name].payloadType;
    }
}

module.exports = { CTraderProtobufReader, };
