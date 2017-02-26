//Need config for:
//Number of minutes between decisions for AI (default: 5),
//Ignored domains/devices
//Need connection info for HA - can I auto discover? (see history.js)
var brain = require('brain');
var fs = require('fs'), isJSON = require('./isJSON.js');
var ignored_domains = ['configurator','other','climate'];
var History = require('./history.js');
var history = History();
var state_changes = [];
var first_change = null;
var training_data = [];
var _ = require('underscore');
var now = new Date();
console.time('ehma');

//Correct date format for retrieve_history: 2017-01-28 08:39:49
//MBP IP 192.168.0.100
history.retrieve_history('homebridge.local','8123','asdf','2017-01-28 08:39:49',now.toJSON().replace(/T/, ' ').replace(/\..+/, ''));
history.once('history_retrieved', function(data) {

  console.log("History was retrieved!");
  parse_history_data(data);
  first_change = get_first_change();

  //Now we have parsed history data, where it only shows the actual state changees
  //Need to turn that into minute-by-minute data that we can use to train the AI

  var dow = 0, dt = null, desired_state=null;
  var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  for (var y = first_change.y; y <= now.getFullYear(); y++) {
    // If year is evenly divisible by 4 and not evenly divisible by 100,
    // or is evenly divisible by 400, then a leap year
    //Original logic found here: http://stackoverflow.com/questions/5812220/how-to-validate-a-date
    if ((!(y % 4) && y % 100) || !(y % 400)) {
      daysInMonth[1] = 29;
    } else { //Set it back to 28, in case we switched to 29 for last year
      daysInMonth[1] = 28;
    }

    for (var M = 1; M <= 12; M++) {
      //console.log((new Date(y,M,1)).toString());
      if (new Date(y,M,1) > now) break; //if we're looking into the future, we're done
      for (var d = 1; d <= 31; d++) {
        if (new Date(y,M,d) > now) break; //if we're looking into the future, we're done
        //If this isn't a valid date (like Feb 30th), skip to the next day
        if (d > daysInMonth[M]) {
          console.log("Continuing:",M,d)
          continue;
        }

        dt = new Date(y,M,d);
        dow = dt.getDay().toString();
        console.log(dt.toString(), " Day of Week: ", dow)
        for (var h = 0; h < 24; h++) {
          if (new Date(y,M,1,h,0,0) > now) break; //if we're looking into the future, we're done
          //console.log(check_state("switch","carters_room_light",{"y":y,"M":M,"d":d,"h":h,"m":0,"dow":dow}))
          for (var m = 0; m < 60; m+=5) {
            if (new Date(y,M,1,h,m,0) > now) break; //if we're looking into the future, we're done

            //###Needs to be updated to account for other sensor data and other switches
            desired_state = check_state("switch","carters_room_light",{"y":y,"M":M,"d":d,"h":h,"m":m,"dow":dow});
            var numeric_state = (desired_state=='off'?0:1)
            if (!_.isEqual(desired_state, {})) {
              //console.log("Adding info to training_data")
              training_data.push(
                {'input': {
                  'y':y,
                  'M':M,
                  'd':d,
                  'h':h,
                  'm':m,
                  'dow':dow
                  //Skipping seconds, because we're looping by the minute
                },'output':{
                  'state': numeric_state
                }
              });
            }
          }
        }
      }
    }
  }

  console.log("Training now");
  //console.log("training data:",training_data);
  //fs.writeFile('training_data.txt',JSON.stringify(training_data));

  var net = new brain.NeuralNetwork();

  net.train(training_data, {
    errorThresh: 0.005,  // error threshold to reach
    log: true,           // console.log() progress periodically
    logPeriod: 100       // number of iterations between logging
  });

  console.log("Training done, running");
  console.log(net.run({
    'y':2017,
    'M':1,
    'd':16,
    'h':18,
    'm':00,
    'dow':5
    //Skipping seconds, because we're looping by the minute
  }));
  console.log("Total Time Taken To Run:");
  console.timeEnd('ehma');
/*
if (_.isEqual(cj_state, desired_state)) {
  //Do nothing, we have the right state
  //console.log("They match. Continuing.")
  continue;
} else {
  //Update the state, display message
  //console.log("Changing State to", desired_state);
  //console.log(cj_state,desired_state);
  cj_state = desired_state;
}
*/

/*
for (var i = 0; i < state_changes.length; i++) {
  for (var x = 0; x < state_changes[i].length; x++) {
    var last_change = state_changes[i][x][0].change_date;
    var current_change = last_change;
    for (var y = 0; y < state_changes[i][x][y].length; y++) {
      if (state_changes[i][x][y]) {
        var d = new Date(current_change.y, current_change.M, current_change.d,
                         current_change.h, current_change.m);
        var d2 = new Date(last_change.y, last_change.M, last_change.d,
                          current_change.h, current_change.m);
      }
    }
  }
  //Loop through # of minutes between start & end of history

  //Build array w/ time, state of each sensor
}
*/

  //Build array w/ time, state, sensor state

  //Train AI

  //Loop through each minute of the day to display triggers on when the AI would change the state of each device
  //This is only for testing, obviously, we'd go with actually changing the states after testing
});
history.on('error', function(err) {
  console.log("An error occurred: ",err);
});

function get_first_change() {
  var check_time = null, array_time = null;
  //console.log("Iterating through state_changes:",state_changes);

  for (var device_type in state_changes) {
    console.log("Device Type: " + device_type);
    for (var device_id in state_changes[device_type]) {
      console.log("Device ID: " + device_id);
      console.log("Device: ", state_changes[device_type][device_id][0]);
      array_time = state_changes[device_type][device_id][0].change_date;
      if (check_time == null || to_datetime(check_time) > to_datetime(array_time)) {
        check_time = array_time;
        console.log("*********** Changed");
      }
      console.log(check_time);
    }
  }
  return check_time;
  /*
  for (var i = 0; i < state_changes.length; i++) {
      console.log("[{i}]")
    for (var x = 0; x < state_changes[i].length; x++) {
      console.log("[{i}][{x}]")
      console.log(state_changes[i][x][0].device)
      //We don't need another loop for the device changes,
      //because history should return them in chronological order
      array_time = state_changes[device_type][device_id][0].change_date;
      if (check_time == null || to_datetime(check_time) > to_datetime(array_time)) {
        check_time = array_time;
      }
    }
  }*/
}

function check_state(device_type, device_id, check_time) {
  var current_state = {};
  for (var i=0; i < state_changes[device_type][device_id].length; i++) {
    var array_time = state_changes[device_type][device_id][i].change_date;
    //console.log("Check Time: ", check_time);
    //console.log("Array Time: ", array_time);
    if (to_datetime(check_time) < to_datetime(array_time)) {
      //console.log("Array time > check time");
      return current_state;
    } else {
      //The check_time is still greater than this array member's time,
      //note the current state and move on to the next one
      current_state = state_changes[device_type][device_id][i].state;
    }
  }
  //If we get here, we never found a time later than check_time
  //Go ahead and return the last current_state because that's
  //what it should still be
  //console.log("Nothing older than check_time");
  return current_state;
}

function to_datetime(dt) {
  return new Date(dt.y, dt.M, dt.d,
                  dt.h, dt.m);
}

function parse_history_data(data) {
  if (typeof data == 'string')
    var json = JSON.parse(data);
  else
    var json = data;

  if (!isJSON(json)) return false; //If it's not JSON at this point, we don't have data

  //console.log(json);

  for (var domain = 0; domain < json.length; domain++) {
    console.log("New domain:",domain);
    for (var id = 0; id < json[domain].length; id++) {
      var state = json[domain][id].state;
      var device = json[domain][id].entity_id;
      var device_type = device.split('.')[0];
      var device_id = device.split('.')[1];
      console.log("New Device",device_type + "." + device_id);

      //Filters
      //###TODO: Needed - device_id filters, state filters & state changers (ie, unknown=off or something)
      if (ignored_domains.indexOf(device_type) >= 0) break;

      if (typeof state_changes[device_type] == 'object') {
        if (typeof state_changes[device_type][device_id] == 'object') {
          if (state == state_changes[device_type][device_id][state_changes[device_type][device_id].length-1].state) {
            continue;
          }
        }
      }

      var last_changed = json[domain][id].last_changed.split('T');
      var last_changed_date = last_changed[0].split('-');
      var last_changed_time = last_changed[1].split(':');
      var last_changed_dow = (new Date(last_changed[0])).getDay(); //0 based (0=Sunday)
      var change_date = {
        'y':last_changed_date[0],
        'M':last_changed_date[1]-1, //Month is 0 based, History data is not
        'd':last_changed_date[2],
        'h':last_changed_time[0],
        'm':last_changed_time[1],
        'dow':last_changed_dow.toString()
        //Skipping seconds, because we're looping by the minute
      }

      //If there's no array for this device_type, create one
      if (state_changes[device_type] == null) {
        state_changes[device_type] = [];
      }

      //If there's no array for this device_id, create one
      if (state_changes[device_type][device_id] == null) {
        state_changes[device_type][device_id] = [];
      }

      console.log("adding device");
      state_changes[device_type][device_id].push({
        'device':device,
        'change_date':change_date,
        'state':state
      });
    }
  }
  //console.log(state_changes);

  return (state_changes != []);

}
