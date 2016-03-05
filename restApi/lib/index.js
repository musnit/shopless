var doc = require('dynamodb-doc');
var dynamo = new doc.DynamoDB();

// Single - All
module.exports.singleAll = function(event, cb) {

  var response = {
    message: 'Your Serverless function ran successfully via the \''
    + event.httpMethod
    + '\' methoq!'
    + ' event.resourcePath: '
    + event.resourcePath
    + ' event.modelName: '
    + event.modelName
    + ' event.pathId: '
    + event.pathId
  };
  var operation = event.httpMethod;
  var dynamoCallback = function(error, data){
    cb(error, data);
  };

  var payload = {
    TableName: event.modelName,
  };

  switch (operation) {
    case 'POST':
      payload.Item = event.body;
      dynamo.putItem(payload, dynamoCallback);
      break;
    case 'GET':
      payload.Key = event.pathId;
      dynamo.getItem(payload, dynamoCallback);
      break;
    case 'PATCH':
      payload.Key = event.pathId;
      dynamo.updateItem(payload, dynamoCallback);
      break;
    case 'DELETE':
      payload.Key = event.pathId;
      dynamo.deleteItem(payload, dynamoCallback);
      break;
    case 'list':
      dynamo.scan(payload, dynamoCallback);
      break;
    case 'echo':
      cb(null, payload);
      break;
    case 'ping':
      cb(null, 'pong');
      break;
    default:
      return cb(new Error('Unrecognized operation "' + operation + '"'));
  }
};
