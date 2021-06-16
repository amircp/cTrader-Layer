import { CTraderCommandParameters } from "#commands/CTraderCommandParameters";
import { GenericObject } from "#utilities/GenericObject";

export class CTraderCommand {
    readonly #clientMsgId: string;
    readonly #responsePromise: Promise<GenericObject>;
    #response?: GenericObject;
    #resolve?: (response: GenericObject) => void;
    #reject?: (response: GenericObject) => void;

    public constructor ({ clientMsgId, }: CTraderCommandParameters) {
        this.#clientMsgId = clientMsgId;
        this.#responsePromise = new Promise((resolve: (response: GenericObject) => void, reject: (response: GenericObject) => void) => {
            this.#resolve = resolve;
            this.#reject = reject;
        });
        this.#response = undefined;
    }

    public get clientMsgId (): string {
        return this.#clientMsgId;
    }

    public get responsePromise (): Promise<GenericObject> {
        return this.#responsePromise;
    }

    public get response (): GenericObject | undefined {
        return this.#response;
    }

    public resolve (response: GenericObject): void {
        this.#response = response;
        this.#resolve?.(response);
    }

    public reject (response: GenericObject): void {
        this.#response = response;
        this.#reject?.(response);
    }
}
