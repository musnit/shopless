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

  var params = {
    TableName: event.modelName,
  };

  switch (operation) {
    case 'POST':
      params.Item = event.body;
      dynamo.putItem(params, dynamoCallback);
      break;
    case 'GET':
      params.Key = { name: event.pathId };
      dynamo.getItem(params, dynamoCallback);
      break;
    case 'PATCH':
      params.Key = { name: event.pathId };
      var mappedBody = {};
      Object.keys(event.body).map(function(value, index) {
       mappedBody[value] = { Value: event.body[value] };
      });
      params.AttributeUpdates = mappedBody;
      dynamo.updateItem(params, dynamoCallback);
      break;
    case 'DELETE':
      params.Key = { name: event.pathId };
      dynamo.deleteItem(params, dynamoCallback);
      break;
    case 'list':
      dynamo.scan(params, dynamoCallback);
      break;
    case 'echo':
      cb(null, params);
      break;
    case 'ping':
      cb(null, 'pong');
      break;
    default:
      return cb(new Error('Unrecognized operation "' + operation + '"'));
  }
};
