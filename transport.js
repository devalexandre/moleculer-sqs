const { ServiceBroker } = require("moleculer");
const { SQSTransporter } = require("./index");

const transport = new SQSTransporter({
	accessKeyId: "",
	secretAccessKey: "",
	apiVersion: "",
	region: ""
});

// Create a ServiceBroker
const broker = new ServiceBroker({
	transporter: transport
});

// Define a service
broker.createService({
	name: "calcular",
	actions: {
		async add(ctx) {
			const result = ctx.params.a + ctx.params.b;
			return result;
		}
	}
});

broker
	.start()
	// Call the service
	.then(() => broker.call("calcular.add", { a: 5, b: 3 }))
	// Print the response
	.then(res => {
		console.log("5 + 3 =", res);
	})
	.catch(err => {
		console.error("Error occured!", err.message);
	});
