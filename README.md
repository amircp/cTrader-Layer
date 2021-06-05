# cTrader Layer
A Node.js communication layer for the cTrader [Open API](https://connect.spotware.com).

## Installation
```console
npm install @reiryoku/ctrader-layer
```

## Usage
For the cTrader Open API usage refer to the [Open API Documentation](https://spotware.github.io/open-api-docs/).

### How to establish a connection
```javascript
const { CTraderConnection } = require("@reiryoku/ctrader-layer");

const connection = new CTraderConnection({
    host: "demo.ctraderapi.com",
    port: 5035,
});

await connection.open();
```

### How to authenticate an application
You can use the `sendCommand` method to send a command with payload to the server.
The method returns a `Promise` resolved only when a response from the server is recevied.
If the response to the command contains an error code then the returned `Promise` is rejected.

```javascript
await connection.sendCommand(
    connection.getPayloadTypeByName("ProtoOAApplicationAuthReq"), {
        clientId: "foo",
        clientSecret: "bar",
    },
);
```

### How to keep connection alive
You can send a heartbeat message every 25 seconds to keep the connection alive.
```javascript
setInterval(() => connection.sendHeartbeat(), 25000);
```