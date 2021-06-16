import { GenericObject } from "#utilities/GenericObject";

const protobuf = require("protobufjs");

export class CTraderProtobufReader {
    #params: any;
    #builder: any;
    readonly #payloadTypes: {
        [key: string]: any;
    };
    readonly #names: any;
    readonly #messages: any;
    readonly #enums: any;

    public constructor (options: GenericObject) {
        this.#params = options;
        this.#builder = undefined;
        this.#payloadTypes = {};
        this.#names = {};
        this.#messages = {};
        this.#enums = {};
    }

    public encode (payloadType: number, params: GenericObject, clientMsgId: string): any {
        const Message = this.getMessageByPayloadType(payloadType);
        const message = new Message(params);

        return this.#wrap(payloadType, message, clientMsgId).encode();
    }

    public decode (buffer: GenericObject): any {
        const protoMessage = this.getMessageByName("ProtoMessage").decode(buffer);
        const payloadType = protoMessage.payloadType;

        return {
            payload: this.getMessageByPayloadType(payloadType).decode(protoMessage.payload),
            payloadType: payloadType,
            clientMsgId: protoMessage.clientMsgId,
        };
    }

    #wrap (payloadType: number, message: GenericObject, clientMsgId: string): any {
        const ProtoMessage = this.getMessageByName("ProtoMessage");

        return new ProtoMessage({
            payloadType: payloadType,
            payload: message.toBuffer(),
            clientMsgId: clientMsgId,
        });
    }

    public load (): void {
        this.#params.forEach((param: any) => {
            this.#builder = protobuf.loadProtoFile(param.file, this.#builder);
        });
    }

    public build (): any {
        const builder: any = this.#builder;

        builder.build();

        const messages: any[] = [];
        const enums: any[] = [];

        builder.ns.children.forEach((reflect: any) => {
            const className: string = reflect.className;

            if (className === "Message") {
                messages.push(reflect);
            }
            else if (className === "Enum") {
                enums.push(reflect);
            }
        });

        messages.filter((message) => typeof this.findPayloadType(message) === "number").forEach((message) => {
            const name: string = message.name;
            const messageBuilded: any = builder.build(name);

            this.#messages[name] = messageBuilded;

            const payloadType = this.findPayloadType(message);

            this.#names[name] = {
                messageBuilded: messageBuilded,
                payloadType: payloadType,
            };
            this.#payloadTypes[payloadType] = {
                messageBuilded: messageBuilded,
                name: name,
            };
        });

        enums.forEach((enume: any) => {
            const name: string = enume.name;

            this.#enums[name] = builder.build(name);
        });

        this.#buildWrapper();
    }

    #buildWrapper (): void {
        const name = "ProtoMessage";
        const messageBuilded = this.#builder.build(name);

        this.#messages[name] = messageBuilded;
        this.#names[name] = {
            messageBuilded: messageBuilded,
            payloadType: undefined,
        };
    }

    public findPayloadType (message: GenericObject): any {
        const field = message.children.find((field: any) => field.name === "payloadType");

        if (!field) {
            return undefined;
        }

        return field.defaultValue;
    }

    public getMessageByPayloadType (payloadType: number): any {
        return this.#payloadTypes[payloadType].messageBuilded;
    }

    public getMessageByName (name: string): any {
        return this.#names[name].messageBuilded;
    }

    public getPayloadTypeByName (name: string): number {
        return this.#names[name].payloadType;
    }
}
