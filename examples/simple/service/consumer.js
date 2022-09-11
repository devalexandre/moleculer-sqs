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

brokerConsumer.start();
