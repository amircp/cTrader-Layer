const Buffer = require("buffer").Buffer;

class CTraderEncoderDecoder {
    #sizeLength;
    #size;
    #tail;
    #decodeHandler;

    constructor () {
        this.#sizeLength = 4;
        this.#size = undefined;
        this.#tail = undefined;
        this.#decodeHandler = undefined;
    }

    setDecodeHandler (handler) {
        this.#decodeHandler = handler;
    }

    encode (data) {
        data = data.toBuffer();

        const sizeLength = this.#sizeLength;
        const dataLength = data.length;
        const size = Buffer.alloc(sizeLength);

        size.writeInt32BE(dataLength, 0);

        return Buffer.concat([ size, data, ], sizeLength + dataLength);
    }

    decode (buffer) {
        const size = this.#size;

        if (this.#tail) {
            buffer = Buffer.concat([ this.#tail, buffer, ], this.#tail.length + buffer.length);

            this.#tail = undefined;
        }

        if (size) {
            if (buffer.length >= size) {
                this.#decodeHandler(buffer.slice(0, size));

                this.#size = undefined;

                if (buffer.length !== size) {
                    this.decode(buffer.slice(size));
                }

                return;
            }
        }
        else {
            if (buffer.length >= this.#sizeLength) {
                this.#size = buffer.readUInt32BE(0);

                if (buffer.length !== this.#sizeLength) {
                    this.decode(buffer.slice(this.#sizeLength));
                }

                return;
            }
        }

        this.#tail = buffer;
    }
}

module.exports = { CTraderEncoderDecoder, };
