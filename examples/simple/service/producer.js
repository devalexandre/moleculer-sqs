"use strict";

const { ServiceBroker } = require("moleculer");
const ChannelsMiddleware = require("@moleculer/channels").Middleware;
const { SQSChannel } = require("../../../index");
const adapter = new SQSChannel({
	accessKeyId: "AKIAXNNEHSOTTEBJCAJD",
	secretAccessKey: "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",
	apiVersion: "2012-11-05",
	region: "us-east-1"
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

brokerProducer
	.start()
	// Call the service
	.then(async () => await brokerProducer.sendToChannel("sum", { a: 5, b: 10 }))
	.then(response => {
		console.log("RESPONSE", response);
	})
	.catch(err => {
		console.error("Error occured!", err.message);
	});
