class CTraderCommand {
    readonly #clientMsgId: string;
    readonly #responsePromise: Promise<any>;

    constructor ({ clientMsgId, }) {
        this.#clientMsgId = clientMsgId;
        this.#responsePromise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    public get clientMsgId (): string {
        return this.#clientMsgId;
    }

    public get responsePromise (): Promise<any> {
        return this.#responsePromise;
    }
}

module.exports = { CTraderCommand, };
