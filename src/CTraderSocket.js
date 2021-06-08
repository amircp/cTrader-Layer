const tls = require("tls");

class CTraderSocket {
    host;
    port;
    #socket;

    constructor ({ host, port, }) {
        this.host = host;
        this.port = port;
        this.#socket = undefined;
    }

    connect () {
        const socket = tls.connect(this.port, this.host, this.onOpen);

        socket.on("data", this.onData);
        socket.on("end", this.onClose);
        socket.on("error", this.onError);

        this.#socket = socket;
    }

    send (data) {
        this.#socket.write(data);
    }

    onOpen () {
        // Silence is golden.
    }

    onData () {
        // Silence is golden.
    }

    onClose () {
        // Silence is golden.
    }

    onError () {
        // Silence is golden.
    }
}

module.exports = { CTraderSocket, };
