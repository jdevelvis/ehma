//Need to accept parameters for ip, port, start_date, end_date, api_password

var Client = require('node-rest-client').Client,
    EventEmitter = require('events').EventEmitter,
    inherits = require('util').inherits,
    isValidDate = require('./isValidDate.js');

function History() {
  if (! (this instanceof History)) return new History();

  EventEmitter.call(this);
}

inherits(History, EventEmitter);

//Protype functions:
History.prototype.retrieve_history = function (host, port, rest_api_password, start_date, end_date) {
  var self = this;
  var client = new Client();
  var _headers = { "Content-Type": "application/json" };
  if (rest_api_password) _headers['x-ha-access'] = rest_api_password;
  //if (end_date) _headers[]
  var args = {
      requestConfig: { timeout: 1000 },
      responseConfig: { timeout: 2000 },
      headers: _headers
  };

  /*
  console.log("Start Date:",(new Date(start_date).toString()));
  console.log("Valid Start Date?", isValidDate(new Date(start_date)));
  */

  //if (isValidDate(new Date(start_date)))

  var location = "http://" + host + ":" + port + "/api/history/period";
  if (start_date) location += "/" + start_date;
  if (end_date) location += "?end_time=" + end_date;
  console.log(location);
  var req1 = client.get(location, args, function (data, response) {
      // parsed response body as js object
      //console.log(JSON.stringify(data));

      //Return the history object, regardless of what data is there
      self.emit("history_retrieved", data);

  }).on('error', function (err) {
      self.emit("error", err);
  });
}

module.exports = History;
