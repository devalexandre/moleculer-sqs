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
const { ServiceBroker } = require("moleculer");
const { SQSChannel } = require("@devevangelista/moleculer-sqs");

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
			return msg.a + msg.b;
		}
	}
});

broker
	.start()
	// Call the service
	.then(() => broker.sendToChannel("sum", { a: 5, b: 3 }))
	.then(res => this.logger.info("O resultado é", res))
	.catch(err => {
		console.error("Error occured!", err.message);
	});
```

### Transport

```js
const { ServiceBroker } = require("moleculer");
const { SQSTransporter } = require("./index");

const transport = new SQSTransporter({
	accessKeyId: "",
	secretAccessKey: "",
	apiVersion: "2012-11-05",
	region: "us-east-1",
	isServeless: true
});

// Create a ServiceBroker
const broker = new ServiceBroker({
	transporter: transport,
	transit: {
		maxQueueSize: 50 * 1000, // 50k ~ 400MB,
		maxChunkSize: 256 * 1024, // 256KB
		disableReconnect: false,
		disableVersionCheck: true
	}
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

broker
	.start()
	// Call the service
	.then(() => broker.call("calcular.add", { a: 5, b: 3 }))
	// Print the response
	.then(res => {
		console.log("5 + 3 =", res);
	})
	.catch(err => {
		console.error("Error occured!", err.message);
	});
```
