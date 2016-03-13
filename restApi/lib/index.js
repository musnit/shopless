var doc = require('dynamodb-doc');
var dynamo = new doc.DynamoDB();

// Single - All
module.exports.singleAll = function(event, cb) {

  var operation = event.httpMethod;
  var dynamoCallback = function(error, data){
    cb(error, data);
  };

  var params = {
    TableName: event.modelName
  };

  switch (operation) {
    case 'POST':
      params.Item = event.body;
      dynamo.putItem(params, function(error, data){
        if (error) {
          cb(error, undefined);
        }
        else {
          dynamo.getItem({
            TableName: event.modelName,
            Key: { name: event.body.name }
          }, dynamoCallback);
        }
      }.bind(this));
      break;
    case 'GET':
      if(typeof event.pathId === undefined || event.pathId === ""){
        dynamo.scan(params, dynamoCallback);
      }
      else {
        params.Key = { name: event.pathId };
        dynamo.getItem(params, dynamoCallback);
      }
      break;
    case 'PATCH':
      params.Key = { name: event.pathId };
      var mappedBody = {};
      Object.keys(event.body).map(function(value, index) {
       mappedBody[value] = { Value: event.body[value] };
      });
      params.AttributeUpdates = mappedBody;
      dynamo.updateItem(params, function(error, data){
        if (error) {
          cb(error, undefined);
        }
        else {
          dynamo.getItem({
            TableName: event.modelName,
            Key: { name: event.pathId }
          }, dynamoCallback);
        }
      }.bind(this));

      break;
    case 'DELETE':
      params.Key = { name: event.pathId };
      dynamo.deleteItem(params, dynamoCallback);
      break;
    default:
      return cb(new Error('Unrecognized operation "' + operation + '"'));
  }
};
