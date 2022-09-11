"use strict";

const { ServiceBroker } = require("moleculer");
const ChannelsMiddleware = require("@moleculer/channels").Middleware;
const { SQSChannel } = require("../../../index");
const adapter = new SQSChannel({
	accessKeyId: "AKIAXNNEHSOTTEBJCAJD",
	secretAccessKey: "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",
	apiVersion: "2012-11-05",
	region: "us-east-1",
	isServeless: true
});
// Create a ServiceBroker
const brokerProducer = new ServiceBroker({
	logLevel: {
		CHANNELS: "debug",
		"**": "info"
	},
	middlewares: [
		ChannelsMiddleware({
			adapter
		})
	]
});

const brokerConsumer = new ServiceBroker({
	logLevel: {
		CHANNELS: "debug",
		"**": "info"
	},
	middlewares: [
		ChannelsMiddleware({
			adapter
		})
	]
});

// Define a service
brokerConsumer.createService({
	name: "calcular",
	channels: {
		async sum(msg, raw) {
			console.log(`Paylod is ${JSON.stringify(msg)}`);
			return msg.a + msg.b;
		}
	}
});

brokerProducer
	.start()
	// Call the service
	.then(async () => await brokerProducer.sendToChannel("sum", { a: 35, b: 25 }))
	.then(response => {
		brokerConsumer.start();
		console.log("RESPONSE", response);
	})
	.catch(err => {
		console.error("Error occured!", err.message);
	});
