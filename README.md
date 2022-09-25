# Moleculer SQS Transport And Moleculer Channel

![](https://docs.aws.amazon.com/pt_br/sdk-for-javascript/v2/developer-guide/images/code-samples-sqs.png)

Moleculer SQS is channel for use AWS SQS.

## How To

### 1 Step

```
npm i @indevweb/moleculer-transport-amazonsqs
```

### 2 Step

Use a official
[AWS SQS Doc](https://docs.aws.amazon.com/pt_br/sdk-for-javascript/v2/developer-guide/configuring-the-jssdk.html) for more details of configuration.

### Channel

When You use channels , it haven't return like transport.

```js
const ChannelsMiddleware = require("@moleculer/channels").Middleware;
const { SQSChannel } = require("@indevweb/moleculer-sqs");

const adapter = new SQSChannel({
	accessKeyId: "",
	secretAccessKey: "",
	apiVersion: "2012-11-05",
	region: "us-east-1",
	isServeless: true
});

// Create a ServiceBroker
const broker = new ServiceBroker({
	middlewares: [
		ChannelsMiddleware({
			adapter
		})
	]
});

// Define a service
broker.createService({
	name: "calcular",
	channels: {
		async sum(msg, raw) {
			console.log(`Paylod is ${JSON.stringify(msg)}`);
		}
	}
});

broker
	.start()
	// Call the service
	.then(() => broker.sendToChannel("sum", { a: 5, b: 3 }))
	.catch(err => {
		console.error("Error occured!", err.message);
	});
```

### Transport

When use transport you can to use for call some function and return
the result or can you call other service, using sqs.

```js
const ChannelsMiddleware = require("@moleculer/channels").Middleware;
const { SQSTransporter } = require("@indevweb/moleculer-sqs");

const transport = new SQSTransporter({
	accessKeyId: "",
	secretAccessKey: "",
	apiVersion: "2012-11-05",
	region: "us-east-1",
	isServeless: false
});

// Create a ServiceBroker
const broker = new ServiceBroker({
	nodeID: "match",
	namespace: "calcular",
	transporter: transport
});

// Define a service
broker.createService({
	name: "calcular",
	actions: {
		async add(ctx) {
			const result = ctx.params.a + ctx.params.b;
			return result;
		}
	}
});

broker.start();
```
