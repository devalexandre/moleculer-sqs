# [WIP] Moleculer SQS Transport 

![](https://docs.aws.amazon.com/pt_br/sdk-for-javascript/v2/developer-guide/images/code-samples-sqs.png)

Moleculer SQS is transport for use AWS SQS.

## How To

### 1 Step

Install dependencies for moleculer project and aws-sdk.

```
npm i aws-sdk moleculer -S
```

### 2 Step

```
npm i @indevweb/moleculer-transport-amazonsqs
```

### 3 Step
Use a official
[AWS SQS Doc](https://docs.aws.amazon.com/pt_br/sdk-for-javascript/v2/developer-guide/configuring-the-jssdk.html) for more details of configuration.



```js
const { ServiceBroker } = require("moleculer");
const SQSTransporter = require("@indevweb/moleculer-transport-amazonsqs");

const transport = new SQSTransporter({
    accessKeyId: "",
    secretAccessKey: "",
    apiVersion: '',
    region: '',
})


// Create a ServiceBroker
const broker = new ServiceBroker({
    transporter: transport,
});

// Define a service
broker.createService({
    name: "calcular",
    actions: {
       async add(ctx) {
           const result = ctx.params.a + ctx.params.b;
            return result
        }
    }
    
});


broker.start()
    // Call the service
    .then(() => broker.call("calcular.add", { a: 5, b: 3 }))
    // Print the response
    .then(res => {
        console.log("5 + 3 =", res)
 
    })
    .catch(err => {
        console.error("Error occured!" ,${err.message})
      
    });
```