"use strict";

const Transporter = require("moleculer").Transporters.Base;
const { MoleculerError } = require("moleculer").Errors;

/**
 * @class Base
 * @extends {Transporter}
 */

class SQSTransporter extends Transporter {
	/**
	 * Creates an instance of SQSTransporter.
	 *
	 * @param {any} opts
	 *
	 * @memberof SQSTransporter
	 */
	constructor({ accessKeyId, secretAccessKey, apiVersion, region, isServeless = false }) {
		super({ accessKeyId, secretAccessKey, apiVersion, region, isServeless });
		this.client = null;
		this.opts = this.verify({ accessKeyId, secretAccessKey, apiVersion, region });
		this.isServeless = isServeless;
		this.connected = false;
		this.stopping = false;
		this.disableVersionCheck = true;
	}

	/**
	 * Connect to a SQS server
	 *
	 * @memberof SQSTransporter
	 */

	connect() {
		return new this.broker.Promise((resolve, reject) => {
			let AWS;
			try {
				AWS = require("aws-sdk");
			} catch (err) {
				/* istanbul ignore next */
				this.broker.fatal(
					"The 'aws-sdk' package is missing. Please install it with 'npm install aws-sdk --save' command.",
					err,
					true
				);
			}

			this.client = new AWS.SQS(this.opts);
			if (!this.client) reject("Error connecting to SQS");
			this.logger.info("SQS client is connected.");

			this.onConnected().then(resolve);
		});
	}

	/**
	 * Disconnect from a SQS server
	 *
	 * @memberof SQSTransporter
	 */
	async disconnect() {
		this.stopping = true;

		try {
			if (this.client) {
				this.logger.info("Closing SQS AWS connection...");

				this.logger.info("SQS AWS connection closed.");
			}
		} catch (error) {
			this.logger.error("Error while closing NATS SQS AWS connection.", error);
		}

		this.connected = false;
	}

	/**
	 * Subscribe to a command
	 *
	 * @param {String} cmd
	 * @param {String} nodeID
	 *
	 * @memberof SQSTransporter
	 */
	async subscribe(cmd, nodeID) {
		const queueName = this.getTopicName(cmd, nodeID);

		const params = Object.prototype.hasOwnProperty.call(this.opts, "params")
			? this.opts.params
			: this.defaultParams();

		params.QueueUrl = await this.createQueue(queueName);

		const { Messages } = await this.client.receiveMessage(params).promise();

		if (Messages) {
			const message = Messages[0];

			this.logger.debug(`queueName Received ${message.Body}`);
			this.receive(cmd, message.Body);
			// await this.deleteMessage(params.QueueUrl, message)
		}

		if (!this.isServeless) this.subscribe(cmd, nodeID);
		return this.broker.Promise.resolve();
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
	async send(cmd, payload) {
		if (!this.client)
			throw new MoleculerError("Adapter not yet connected. Skipping publishing.");

		const QueueUrl = await this.createQueue(cmd);
		const message = this.deserialize(cmd, payload);

		const params = {
			MessageBody: JSON.stringify(message),
			QueueUrl
		};

		return this.client.sendMessage(params).promise();
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

	async createQueue(queueName) {
		const QueueName = this.cleartopicName(queueName);

		const params = {
			QueueName
		};
		try {
			const { QueueUrl } = await this.findQueue(params);
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

	cleartopicName(topic) {
		return topic.split(".").join("-");
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

	async deleteMessage(QueueUrl, message) {
		const deleteParams = {
			QueueUrl,
			ReceiptHandle: message.ReceiptHandle
		};

		const removedMessage = await this.client.deleteMessage(deleteParams).promise();
		console.log("removed message");
		console.log(removedMessage);
	}
}

module.exports = SQSTransporter;
