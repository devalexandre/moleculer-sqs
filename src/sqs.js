"use strict";

const Transporter = require("moleculer").Transporters.Base;
const AWS = require("aws-sdk");

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
	constructor({ acessKeyId, secretAccessKey, apiVersion, region, serveless = false }) {
		super({ acessKeyId, secretAccessKey, apiVersion, region });
		this.client = null;
		this.QueueUrl = null;
		this.opts = this.verify({ acessKeyId, secretAccessKey, apiVersion, region });
		this.isServeless = serveless;
	}

	/**
	 * Connect to a SQS server
	 *
	 * @memberof SQSTransporter
	 */
	connect() {
		return new Promise((resolve, reject) => {
			this.client = new AWS.SQS(this.opts);
			if (!this.client) reject("Error connecting to SQS");
			this.logger.info("Connecting to SQS ");
			this.onConnected().then(resolve);
		});
	}

	/**
	 * Disconnect from a SQS server
	 *
	 * @memberof SQSTransporter
	 */
	disconnect(params) {
		this.logger.info("Disconnect to SQS ", params);
		this.client = null;
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
		const params = this.opts.hasOwnProperty("params") ? this.opts.params : this.defaultParams();
		params.QueueUrl = await this.createQueue(queueName);
		const vm = this;

		this.client.receiveMessage(params, (err, data) => {
			if (!this.client) return this.broker.Promise.reject("Error connecting to SQS");
			if (err) {
				this.logger.error(err);
				return this.broker.Promise.reject(err);
			}
			if (data.Messages) {
				const message = data.Messages[0];

				vm.logger.debug(`queueName Received ${message.Body}`);
				vm.receive(cmd, message.Body);
			}

			if (!this.isServeless) this.subscribe(cmd, nodeID);
		});

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
	async send(topic, data) {
		if (!this.client) return this.broker.Promise.reject("Error connecting to SQS");

		const QueueUrl = await this.createQueue(topic);
		const message = JSON.parse(Buffer.from(data).toString());
		const vm = this;
		const params = {
			MessageBody: JSON.stringify(message),
			QueueUrl
		};
		this.client.sendMessage(params, function (err, data) {
			if (err) {
				return err;
			} else {
				vm.logger.debug(` queueName Sent ${topic.split(".").join("-")}`);
				return data.MessageId;
			}
		});

		return this.broker.Promise.resolve();
	}
	verify(opts) {
		if (!opts.hasOwnProperty("region")) {
			throw new Error("region is required");
		}
		if (!opts.hasOwnProperty("apiVersion")) {
			throw new Error("apiVersion is required");
		}
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

		var params = {
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
		if (!opts.hasOwnProperty("region")) {
			throw new Error("region is required");
		}
		if (!opts.hasOwnProperty("apiVersion")) {
			throw new Error("apiVersion is required");
		}
		if (!opts.hasOwnProperty("serveless")) {
			opts.serveless = false;
		}

		return opts;
	}
}

module.exports = SQSTransporter;
