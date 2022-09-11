# [WIP] Moleculer SQS Transport

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

```js
const { ServiceBroker } = require("moleculer");
const SQSTransporter = require("@indevweb/moleculer-transport-amazonsqs");

const adapter = new SqsAdapter({
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
