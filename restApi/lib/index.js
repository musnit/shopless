var doc = require('dynamodb-doc');
var dynamo = new doc.DynamoDB();

var AWS = require('aws-sdk');
var vogels = require('vogels');
var Joi = require('joi');

AWS.config.update({region : 'us-east-1'});
var dynamodb = new AWS.DynamoDB();
vogels.dynamoDriver(dynamodb);

var extractFilters = function(queryParamsString) {
  var queryParamsArray = queryParamsString.slice(1, queryParamsString.length - 1).split(',');
  queryParamsArray = queryParamsArray.map(function(queryParam){
    return queryParam.trim().split('=');
  });
  queryParamsArray = queryParamsArray.filter(function(queryParam){
    return queryParam[0].indexOf('filter[') === 0;
  });
  var filterParams = {};
  queryParamsArray.forEach(function(queryParam){
    var key = queryParam[0].slice(7, queryParam[0].length - 1);
    filterParams[key] = queryParam[1];
  });
  return filterParams;
}

// Single - All
module.exports.singleAll = function(event, cb) {

  var filterParams = extractFilters(event.queryParams);

  //todo: add support for multiple includes and nested includes
  var include = event.include && event.include.trim();

  var dataContextHolder;

  var hasFilters = Object.keys(filterParams).length !== 0;

  var operation = event.httpMethod;
  var dynamoCallback = function(error, data){
    cb(error? JSON.stringify(error) : null, data);
  };

  var tableCallback = function(error, data){
    dataContextHolder = data;
    if (include){
      var Model = vogels.define(include, {
        hashKey : 'id',
        tableName: include,
        schema : {
          id : vogels.types.uuid()
        }
      });

      if (data["Items"]){
        var includeIds = data["Items"].map(function(item){
          return item.attrs[include];
        });

        var query = Model.scan();
        query.where('name').in(includeIds);
        query.exec(includeCallback);
      }
      else {
        var params = {
          TableName: include,
          Key: { name: data["Item"][include] }
        };
        dynamo.getItem(params, includeCallback);
      }
    }
    else {
      dynamoCallback(error, data);
    }
  };

  var includeCallback = function(error, data){
    dataContextHolder.include = {};
    dataContextHolder.include[include] = data;
    dynamoCallback(error, dataContextHolder);
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
      var Model = vogels.define(event.modelName, {
        hashKey : 'id',
        tableName: event.modelName,
        schema : {
          id : vogels.types.uuid()
        }
      });
      if(typeof event.pathId === undefined || event.pathId === ""){
        var query = Model.scan();
        for(var key in filterParams) {
          if(filterParams.hasOwnProperty(key)) {
            query.where(key).equals(filterParams[key]);
          }
        }
        query.exec(tableCallback);
      }
      else {
        params.Key = { name: event.pathId };
        dynamo.getItem(params, tableCallback);
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
