const BaseTransporter = require("moleculer").Transporters.Base;
const AWS = require('aws-sdk');

class SQSTransporter extends BaseTransporter {
    constructor(opts) {
        super(opts);
        this.verify(opts);
        AWS.config.update({region: opts.region.toLowerCase()});
        this.opts = opts;
       
        
    }
    connect() { 
            this.sqs = new AWS.SQS({apiVersion: this.opts.apiVersion});
    }

 	/**
	 * Subscribe to a command
	 *
	 * @param {String} cmd
	 *
	 * @memberof RedisTransporter
	 */
    async  subscribe(cmd, nodeID) {
        try{
		const topic = this.getTopicName(cmd, nodeID);
            const params = this.opts.hasOwnProperty('params') ? this.opts.params  : this.defaultParams()
            params.QueueUrl = await this.createQueue(topic);
                 
          return  this.sqs.receiveMessage(params, (err, data) => {
                if (err) {
                    this.logger.error(err);
                    return;
                }
                if (data.Messages) {
                    data.Messages.forEach(message => {
                        this.logger.info(`Received message: ${message.Body}`);
                        this.receive(cmd, JSON.parse(message.Body)); 
                    });
                }
            }).promise();
            
           
        } catch (error) {
            throw new Error(error);
        }
    }
    
    
    async send(topic, data) {
        try {
            const  QueueUrl = await this.createQueue(topic)
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            const params = {
                MessageBody: message,
                QueueUrl
            }
            return this.sqs.sendMessage(params, function(err, data) {
                if (err) {
                  return err;
                } else {
                  return data.MessageId;
                }
              }).promise();
             
        } catch (error) {
            throw new Error(error);
        }
    }
    
    verify(opts) {
        if(!opts.hasOwnProperty('region')) {
            throw new Error('region is required');
        }
        if(!opts.hasOwnProperty('apiVersion')) {
            throw new Error('apiVersion is required');
        }
     

    }


    defaultParams() {
        return {
            AttributeNames: [
                "All"
            ],
            MaxNumberOfMessages: 10,
            MessageAttributeNames: [
                "All"
            ],
            VisibilityTimeout: 20,
            WaitTimeSeconds: 0
        }
    }

    async createQueue(queueName) {
        const QueueName = this.cleartopicName(queueName);
        var params = {
            QueueName
        };
        try {
            const { QueueUrl } =   await this.findQueue(params); 
            return QueueUrl;

        } catch (error) {
        const { QueueUrl } = await this.sqs.createQueue(params, (err, data) => {
            if (err) {
                return err;
            }
            return data.QueueUrl;
        }).promise();

               
        return QueueUrl;
        
    }

    }

    async findQueue(params) {

       return   this.sqs.getQueueUrl(params, (err, data) => {
            if (err) {
                return null;
            }
            return data.QueueUrl;
        }
        ).promise();
    }

    cleartopicName(topic) {
        return topic.split('.').join('-')
    }
}

module.exports = SQSTransporter;