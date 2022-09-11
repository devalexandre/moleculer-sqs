const SQSChannel = require("../../../src/channel");

const transport = new SQSChannel({
	accessKeyId: "AKIAXNNEHSOTTEBJCAJD",
	secretAccessKey: "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",
	apiVersion: "2012-11-05",
	region: "us-east-1",
	isServeless: true
});

describe("SQSTransporte", () => {
	describe("#connect", () => {
		it("connected", () => {
			transport.connect().then(res => {
				expect(transport.connected).toBeTruthy();
			});
		});
	});

	describe("#createQueue", () => {
		it("create if not exist", () => {
			transport.createQueue("SQS-TEST").then(res => {
				expect(res).toMatch(/SQS-TEST/);
			});
		});
	});

	describe("#subscribeQueue", () => {
		it("subscribe in queue", () => {
			transport.publish("SQS-TEST", { name: "Alexandre" });
			transport.subscribe("SQS-TEST").then(res => {
				expect(res).toMatch(/SQS-TEST/);
			});
		});
	});
});
