import { CTraderCommand } from "#commands/CTraderCommand";
import { CTraderCommandMapParameters } from "#commands/CTraderCommandMapParameters";
import { GenericObject } from "#utilities/GenericObject";

export class CTraderCommandMap {
    readonly #openCommands: Map<string, CTraderCommand>;
    readonly #send: (...parameters: any[]) => void;

    public constructor ({ send, }: CTraderCommandMapParameters) {
        this.#openCommands = new Map();
        this.#send = send;
    }

    public get openCommands (): CTraderCommand[] {
        return [ ...this.#openCommands.values(), ];
    }

    public create ({ clientMsgId, message, }: {
        clientMsgId: string;
        message: GenericObject;
    }): Promise<GenericObject> {
        const command: CTraderCommand = new CTraderCommand({ clientMsgId, });

        this.#openCommands.set(clientMsgId, command);
        this.#send(message);

        return command.responsePromise;
    }

    public extractById (clientMsgId: string): CTraderCommand | undefined {
        const command: CTraderCommand | undefined = this.#openCommands.get(clientMsgId);

        if (!command) {
            return undefined;
        }

        this.#openCommands.delete(clientMsgId);

        return command;
    }
}
