"use strict";

const SQSChannelProcessed = {
	async getMessageIds(chan) {
		const { Messages } = await this.getProcessedMessages(chan);
		return Messages
			? Messages.map(m => {
					const { messageId } = JSON.parse(m.Body);
					return messageId;
			  })
			: [];
	},

	async getProcessedMessages(chan) {
		const channelName = `${chan.name}.processed`;

		if (chan.maxInFlight == null) chan.maxInFlight = this.opts.maxInFlight;
		if (chan.maxRetries == null) chan.maxRetries = this.opts.maxRetries;

		const params = Object.prototype.hasOwnProperty.call(this.opts, "params")
			? this.opts.params
			: this.defaultParams();

		params.QueueUrl = await this.createQueue(channelName);

		if (!this.client) return this.broker.Promise.reject("Error connecting to SQS");

		return this.client.receiveMessage(params).promise();
	},

	async sendToProcessed(chan, { messageId, payload }) {
		const channelName = `${chan.name}.processed`;

		const message = JSON.stringify({ messageId, payload });
		const params = {
			MessageBody: message,
			QueueUrl: await this.createQueue(channelName)
		};

		return this.client.sendMessage(params).promise();
	}
};

module.exports = SQSChannelProcessed;
