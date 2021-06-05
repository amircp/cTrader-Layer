class CTraderCommand {
    constructor ({ clientMsgId, }) {
        this.clientMsgId = clientMsgId;
        this.responsePromise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}

module.exports = { CTraderCommand, };
