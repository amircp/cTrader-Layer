const { CTraderCommand, } = require("./CTraderCommand");

class CTraderCommandList {
    openCommands;
    #send;

    constructor ({ send, }) {
        this.openCommands = [];
        this.#send = send;
    }

    create ({ clientMsgId, message, }) {
        const command = new CTraderCommand({ clientMsgId, });

        this.openCommands.push(command);
        this.#send(message);

        return command.responsePromise;
    }

    extractById (clientMsgId) {
        const openCommands = this.openCommands;
        const length = openCommands.length;

        for (let i = 0; i < length; ++i) {
            const command = openCommands[i];

            if (command.clientMsgId === clientMsgId) {
                openCommands.splice(i, 1);

                return command;
            }
        }

        return undefined;
    }
}

module.exports = { CTraderCommandList, };
