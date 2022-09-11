// Load the AWS SDK for Node.js
const AWS = require("aws-sdk");
// Set the region
AWS.config.update({ region: "REGION" });

// Create an SQS service object
const sqs = new AWS.SQS({
	accessKeyId: "AKIAXNNEHSOTTEBJCAJD",
	secretAccessKey: "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",
	apiVersion: "2012-11-05",
	region: "us-east-1"
});
let queueURL = "SQS_QUEUE_URL";

let params = {
	QueueName: "SQS_QUEUE_NAME",
	Attributes: {
		DelaySeconds: "60",
		MessageRetentionPeriod: "86400"
	}
};

sqs.createQueue(params, function (err, data) {
	if (err) {
		console.log("Error", err);
	} else {
		console.log("Success", data.QueueUrl);
		queueURL = data.QueueUrl;
	}
});

params = {
	MessageBody: "Information about current NY Times fiction bestseller for week of 12/11/2016.",
	// MessageDeduplicationId: "TheWhistler",  // Required for FIFO queues
	// MessageGroupId: "Group1",  // Required for FIFO queues
	QueueUrl: queueURL
};

sqs.sendMessage(params, function (err, data) {
	if (err) {
		console.log("Error", err);
	} else {
		console.log("Success", data.MessageId);
	}
});

sqs.receiveMessage({ QueueUrl: queueURL }, function (err, data) {
	if (err) {
		console.log("Receive Error", err);
	} else if (data.Messages) {
		const deleteParams = {
			QueueUrl: queueURL,
			ReceiptHandle: data.Messages[0].ReceiptHandle
		};
		sqs.deleteMessage(deleteParams, function (err, data) {
			if (err) {
				console.log("Delete Error", err);
			} else {
				console.log("Message Deleted", data);
			}
		});
	}
});
