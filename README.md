# cTrader Layer
A Node.js communication layer for the cTrader [Open API](https://connect.spotware.com).<br>
This implementation is created and maintained by Reiryoku Technologies and its contributors.

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

### How to send commands
You can use the `sendCommand` method to send a command with payload to the server.
The method returns a `Promise` resolved only when a response from the server is received.
If the response to the command contains an error code then the returned `Promise` is rejected.

```javascript
await connection.sendCommand("PayloadName", {
    foo: "bar",
});
```

### How to authenticate an application
```javascript
await connection.sendCommand("ProtoOAApplicationAuthReq", {
    clientId: "foo",
    clientSecret: "bar",
});
```

### How to keep connection alive
You can send a heartbeat message every 25 seconds to keep the connection alive.
```javascript
setInterval(() => connection.sendHeartbeat(), 25000);
```

### How to listen events from server
```javascript
connection.on("EventName", (event) => {
    console.log(event);
});
```

### How to get the access token profile information
Through HTTP request.
```javascript
console.log(await CTraderConnection.getAccessTokenProfile("access-token"));
```

### How to get the access token accounts
Through HTTP request.
```javascript
console.log(await CTraderConnection.getAccessTokenAccounts("access-token"));
```

## Contribution
You can create a PR or open an issue for bug reports or ideas.
