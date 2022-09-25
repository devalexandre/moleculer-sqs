"use strict";

const { Adapters } = require("@moleculer/channels");
const { Base } = Adapters;
const { MoleculerRetryableError } = require("moleculer").Errors;
const SQSChannelProcessed = require("./processed");
let AWS;

class SQSChannel extends Base {
	/**
	 * Creates an instance of SQSAdapter.
	 *
	 * @param {any} opts
	 *
	 * @memberof SqsAdapter
	 */
	constructor({
		accessKeyId,
		secretAccessKey,
		apiVersion,
		region,
		queueUrl = null,
		isServeless = false
	}) {
		super({ accessKeyId, secretAccessKey, apiVersion, region, queueUrl, isServeless });
		this.client = null;
		this.opts = this.verify({ accessKeyId, secretAccessKey, apiVersion, region });
		this.isServeless = isServeless;
		this.subscriptions = new Map();
		this.connected = false;
		this.stopping = false;
		this.QueueUrl = queueUrl;
	}

	/**
	 * Initialize the adapter.
	 *
	 * @param {ServiceBroker} broker
	 * @param {Logger} logger
	 */
	init(broker, logger) {
		super.init(broker, logger);
		try {
			AWS = require("aws-sdk");
		} catch (err) {
			/* istanbul ignore next */
			this.broker.fatal(
				"The 'nats' package is missing! Please install it with 'npm install aws-sdk --save' command.",
				err,
				true
			);
		}

		this.checkClientLibVersion("aws-sdk", "^2.1173.0");
	}

	/*
	 * Connect to a SQS server
	 *
	 * @memberof SQSAdapter
	 */
	async connect() {
		return new Promise((resolve, reject) => {
			this.client = new AWS.SQS(this.opts);
			if (!this.client) reject(new Error("Error connecting to SQS"));
			this.logger.info("Connecting to SQS ");
			this.connected = true;
			resolve(this.client);
		});
	}

	/**
	 * Disconnect from a SQS server
	 *
	 * @memberof SQSTransporter
	 */
	/**
	 * Disconnect from adapter
	 */
	/**
	 * Disconnect from adapter
	 */
	async disconnect() {
		this.stopping = true;

		try {
			if (this.client) {
				this.logger.info("SQS AWS connection closed.");
			}
		} catch (error) {
			this.logger.error("Error while closing NATS SQS AWS connection.", error);
		}

		this.connected = false;
	}

	/**
	 * Subscribe to a channel with a handler.
	 *
	 * @param {Channel & SqlDefaultOptions} chan
	 */

	async subscribe(chan) {
		if (chan.maxInFlight == null) chan.maxInFlight = this.opts.maxInFlight;
		if (chan.maxRetries == null) chan.maxRetries = this.opts.maxRetries;

		const messageIds = await this.getMessageIds(chan);

		const params = Object.prototype.hasOwnProperty.call(this.opts, "params")
			? this.opts.params
			: this.defaultParams();

		params.QueueUrl = this.QueueUrl ? this.QueueUrl : await this.createQueue(chan.name);

		if (!this.client) return this.broker.Promise.reject("Error connecting to SQS");

		this.subscriptions.set(chan.id, this.client);

		this.client.receiveMessage(params, async (err, data) => {
			if (err) {
				this.logger.error(err);
				return this.broker.Promise.reject(err);
			}
			if (data.Messages) {
				for (const message of data.Messages) {
					if (!messageIds.includes(message.MessageId)) {
						const content = JSON.parse(message.Body);

						await this.sendToProcessed(chan, { messageId: message.MessageId, content });
						await chan.handler(content, message);
					}
				}
			}

			if (!this.isServeless) this.subscribe(chan);
		});
	}

	/**
	 * Unsubscribe from a channel.
	 *
	 * @param {Channel} chan
	 */
	async unsubscribe(chan) {
		// this.stopChannelActiveMessages(chan.id);
	}

	/**
	 * Send data buffer.
	 *
	 * @param {String} topic
	 * @param {Buffer} data
	 * @param {Object} meta
	 *
	 * @returns {Promise}
	 */
	async publish(channelName, payload, opts = {}) {
		// Adapter is stopping. Publishing no longer is allowed
		if (this.stopping) return;

		if (!this.connected) {
			throw new MoleculerRetryableError("Adapter not yet connected. Skipping publishing.");
		}

		const QueueUrl = this.QueueUrl ? this.QueueUrl : await this.createQueue(channelName);
		const message = opts.raw ? payload : JSON.stringify(payload);
		const params = {
			MessageBody: message,
			QueueUrl
		};

		this.client.sendMessage(params, function (err, data) {
			if (err) {
				this.logger.error(
					`An error ocurred while publishing message to ${channelName}`,
					err
				);
				return err;
			} else {
				return data.MessageId;
			}
		});

		return this.broker.Promise.resolve();
	}

	async deleteMessage(QueueUrl, message) {
		const deleteParams = {
			QueueUrl,
			ReceiptHandle: message.ReceiptHandle
		};

		const removedMessage = await this.client.deleteMessage(deleteParams).promise();
		console.log("removed message");
		console.log(removedMessage);
	}

	async createQueue(queueName) {
		const QueueName = this.cleartopicName(queueName);

		const params = {
			QueueName
		};
		try {
			const { QueueUrl } = await this.findQueue(params);
			this.QueueUrl = QueueUrl;
			return QueueUrl;
		} catch (error) {
			const { QueueUrl } = await this.client
				.createQueue(params, (err, data) => {
					if (err) {
						return err;
					}
					return data.QueueUrl;
				})
				.promise();
			this.QueueUrl = QueueUrl;
			return QueueUrl;
		}
	}

	async findQueue(params) {
		return this.client
			.getQueueUrl(params, (err, data) => {
				if (err) {
					return null;
				}

				return data.QueueUrl;
			})
			.promise();
	}

	defaultParams() {
		return {
			AttributeNames: ["All"],
			MaxNumberOfMessages: 10,
			MessageAttributeNames: ["All"],
			VisibilityTimeout: 20,
			WaitTimeSeconds: 0
		};
	}

	verify(opts) {
		if (!Object.prototype.hasOwnProperty.call(opts, "region")) {
			throw new Error("region is required");
		}

		if (!Object.prototype.hasOwnProperty.call(opts, "apiVersion")) {
			throw new Error("apiVersion is required");
		}

		if (!Object.prototype.hasOwnProperty.call(opts, "serveless")) {
			opts.serveless = false;
		}

		return opts;
	}

	cleartopicName(topic) {
		return topic.split(".").join("-");
	}

	isObject(obj) {
		if (Object.prototype.toString.call(obj) === "[object Object]") {
			return true;
		}
		return false;
	}
}

Object.assign(SQSChannel.prototype, SQSChannelProcessed);

module.exports = SQSChannel;
