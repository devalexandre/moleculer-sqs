const SQSTransporter = require('../../src/sqs');

describe('Test "transport"', () => {
    let transporter = null;


    beforeAll(() => { 

        transporter = new SQSTransporter({
            apiVersion: '2012-11-05',
            region: 'us-east-1'
        })
        transporter.broker = {Promise:{
            resolve: (res) => Promise.resolve(res),
            reject: (error) => Promise.reject(error)
        }};

       
    });

    it("Test subiscription", async() =>{
        await transporter.connect();
        const sub = await transporter.subscribe('user.create', 'moleculer-test');
        expect(sub).toBeTruthy();
    })

    it("Test send message", async() =>{
        await transporter.connect();
        const sub = await transporter.subscribe('user.create', 'moleculer-test');
        await transporter.send('user.create', {name: 'Alexandre'});
        console.log("MESSAGE SENT %s", JSON.stringify(sub));
        expect(sub).toBeTruthy();
        
    })
});