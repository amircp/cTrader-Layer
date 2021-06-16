import * as tls from "tls";
import { CTraderSocketParameters } from "#sockets/CTraderSocketParameters";

export class CTraderSocket {
    readonly #host: string;
    readonly #port: number;
    #socket?: tls.TLSSocket;

    public constructor ({ host, port, }: CTraderSocketParameters) {
        this.#host = host;
        this.#port = port;
        this.#socket = undefined;
    }

    public get host (): string {
        return this.#host;
    }

    public get port (): number {
        return this.#port;
    }

    public connect (): void {
        // @ts-ignore
        const socket = tls.connect(this.#port, this.#host, this.onOpen);

        socket.on("data", this.onData);
        socket.on("end", this.onClose);
        socket.on("error", this.onError);

        this.#socket = socket;
    }

    public send (buffer: Buffer): void {
        this.#socket?.write(buffer);
    }

    public onOpen (): void {
        // Silence is golden.
    }

    public onData (...parameters: any[]): void {
        // Silence is golden.
    }

    public onClose (): void {
        // Silence is golden.
    }

    public onError (): void {
        // Silence is golden.
    }
}
