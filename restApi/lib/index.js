var doc = require('dynamodb-doc');
var dynamo = new doc.DynamoDB();

var AWS = require('aws-sdk');
var vogels = require('vogels');
var Joi = require('joi');

AWS.config.update({region : 'us-east-1'});
var dynamodb = new AWS.DynamoDB();
vogels.dynamoDriver(dynamodb);

var SECRET_KEY = 'qqq';

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

var searchFilterItems = function(query, stream){
    return stream.filter(function(item) {
      return item.attrs.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
    });
};

function uniq(a) {
    var seen = {};
    return a.filter(function(item) {
        return (seen.hasOwnProperty(item) || item === undefined) ? false : (seen[item] = true);
    });
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
    if(filterParams['search']) {
          var filteredItems = searchFilterItems(filterParams['search'], data["Items"]);
          if(data["Items"]) {
            dataContextHolder = {
              Items: filteredItems,
            };
          }
          else {
            dataContextHolder = {
              Items: [data]
            };
          }
    }
    else {
          if(data["Items"]) {
            dataContextHolder = {
              Items: data["Items"]
            };
          }
          else {
            dataContextHolder = {
              Items: [data]
            };
          }
    }
    if (include){
      var Model = vogels.define(include, {
        hashKey : 'id',
        tableName: include,
        schema : {
          id : vogels.types.uuid()
        }
      });

      var includeIds = dataContextHolder.Items.map(function(item){
        return item.attrs[include];
      });

      Model.getItems(uniq(includeIds), includeCallback);
    }
    else {
      dynamoCallback(error, dataContextHolder);
    }
  };

  var includeCallback = function(error, data){
    var includeContextHolder;
    if(data["Items"]) {
      includeContextHolder = {
        Items: data["Items"]
      };
    }
    else {
      includeContextHolder = {
        Items: [data]
      };
    }

    dataContextHolder.include = {};
    dataContextHolder.include[include] = includeContextHolder;
    dynamoCallback(error, dataContextHolder);
  };

  var Model = vogels.define(event.modelName, {
    hashKey : 'id',
    tableName: event.modelName,
    schema : {
      id : vogels.types.uuid()
    }
  });

  switch (operation) {
    case 'POST':
      if (event.body.secretKey != SECRET_KEY){
        return dynamoCallback('Not Authorized');
      }
      delete(event.body.secretKey);
      Model.create(event.body, dynamoCallback);
      break;
    case 'GET':
      if(typeof event.pathId === undefined || event.pathId === ""){
        var query = Model.scan();
        for(var key in filterParams) {
          if(key != 'search' && filterParams.hasOwnProperty(key)) {
            query.where(key).equals(filterParams[key]);
          }
        }
        query.exec(tableCallback);
      }
      else {
        Model.get(event.pathId, tableCallback);
      }
      break;
    case 'PATCH':
      if (event.body.secretKey != SECRET_KEY){
        return dynamoCallback('Not Authorized');
      }
      delete(event.body.secretKey);
      event.body.id = event.pathId;
      Model.update(event.body, dynamoCallback);
      break;
    case 'DELETE':
      if (event.secretKey != SECRET_KEY){
        return dynamoCallback('Not Authorized');
      }
      Model.destroy(event.pathId, dynamoCallback);
      break;
    default:
      return cb(new Error('Unrecognized operation "' + operation + '"'));
  }
};
