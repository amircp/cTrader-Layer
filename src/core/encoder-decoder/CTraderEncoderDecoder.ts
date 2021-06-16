import { Buffer } from "buffer";
import { GenericObject } from "#utilities/GenericObject";

export class CTraderEncoderDecoder {
    readonly #sizeLength: number;
    #size?: number;
    #tail?: Buffer;
    #decodeHandler?: (...parameters: any[]) => any;

    public constructor () {
        this.#sizeLength = 4;
        this.#size = undefined;
        this.#tail = undefined;
        this.#decodeHandler = undefined;
    }

    public setDecodeHandler (handler: (...parameters: any[]) => any): void {
        this.#decodeHandler = handler;
    }

    public encode (data: GenericObject): Buffer {
        const newData = data.toBuffer();

        const sizeLength: number = this.#sizeLength;
        const dataLength: number = data.length;
        const size = Buffer.alloc(sizeLength);

        size.writeInt32BE(dataLength, 0);

        return Buffer.concat([ size, newData, ], sizeLength + dataLength);
    }

    public decode (buffer: Buffer): void {
        const size: number | undefined = this.#size;
        let usedBuffer: Buffer = buffer;

        if (this.#tail) {
            usedBuffer = Buffer.concat([ this.#tail, usedBuffer, ], this.#tail.length + usedBuffer.length);

            this.#tail = undefined;
        }

        if (size) {
            if (usedBuffer.length >= size) {
                if (this.#decodeHandler) {
                    this.#decodeHandler(usedBuffer.slice(0, size));
                }

                this.#size = undefined;

                if (usedBuffer.length !== size) {
                    this.decode(usedBuffer.slice(size));
                }

                return;
            }
        }
        else {
            if (usedBuffer.length >= this.#sizeLength) {
                this.#size = usedBuffer.readUInt32BE(0);

                if (usedBuffer.length !== this.#sizeLength) {
                    this.decode(usedBuffer.slice(this.#sizeLength));
                }

                return;
            }
        }

        this.#tail = usedBuffer;
    }
}
