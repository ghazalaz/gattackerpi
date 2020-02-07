require('env2')('config.env');

//var Diff = require('diff');
var fs = require('fs');
var util = require('util');
//const readline = require('readline');

var peripheralId = "c1328c86bef8"
var dumpPath=process.env.DUMP_PATH;
//var logFile = dumpPath+ '/'+peripheralId+'.log';
//var inputData = fs.createReadStream(logFile,'utf8');
var notificationData = [];
var writeData = [];
var readData = [];
var dspPath = dumpPath+ '/'+peripheralId+'.dsp';
hexToBinary = require('hex-to-binary');
var writeResponsePair = {}
//readLines(inputData,parse);

function myRand(num){
	const random = require("random");
	var value = random.int(1,num);
	console.log(value.toString(16));
}


function logToJson(input, func, peripheralId) {
  var remaining = '';

  input.on('data', function(data) {
    remaining += data;
    var index = remaining.indexOf('\n');
    var last  = 0;
    while (index > -1) {
      var line = remaining.substring(last, index);
      last = index + 1;
      func(line);
      index = remaining.indexOf('\n', last);
    }

    remaining = remaining.substring(last);

    fs.writeFile(dumpPath+'/'+peripheralId+'.notify.json',JSON.stringify(notificationData),
        function (err) {
            if (err) {
                console.error('Crap happens');
            }
        }
    );
  });

  input.on('end', function() {
    if (remaining.length > 0) {
      func(remaining);
    }
  });
}

function parse(line) {

  var arr=line.split('|');
  var operator = arr[1].trim();
  var serviceUuid = arr[2].trim().split(' ')[0]; //split(' ') to remove optional description
  var uuid = arr[3].trim().split(' ')[0];
  var data = arr[4].trim().split(' ')[0];

  
  switch(operator) {
    case '< W' : console.log('WRITE REQ: ' + data ); 
    			fs.appendFile(dspPath, data, function(err) {
			      if(err) {
			          return console.log(err);
			      }    

			    })
                break;
    case '< C' : console.log('WRITE CMD: ' + data ); 
                break;

    case '> R' : console.log('READ: ' + data + ' --- skip'); 
                break;
    case '> N' : //console.log('NOTIFICATION: ' + data + ' --- skip'); 
                notificationData.push(data);
                break;
  }

}

function match_pattern(str, patterns){
    var max_match = 0;
    var matched_pattern = "";
    var second_max = 0;
    var second_matched = "";

    patterns.forEach( pattern => {
      var tmp_match = 0;
      if (pattern.length <= str.length){
        for (var i=0; i<pattern.length; i++){
          if (pattern[i] == str[i]){
              tmp_match ++;
          }
        }
      if(tmp_match > max_match){
          second_matched = matched_pattern;
          second_max = max_match;

          matched_pattern = pattern;
          max_match = tmp_match;
        }
      }
    });
    return ((matched_pattern == 0)? str:matched_pattern);
    //return ((second_matched == 0)? str:second_matched);
}

function replace(str,old_chr,new_chr){
  return str.replace(old_chr,new_chr);
}

function isCertainData(peripheralId,datastr){
  certain_data = fs.readFileSync("devices/config/"+peripheralId+".conf").toString().replace(/(^[ \t]*\n)/gm,"").split('\n');
  if (certain_data.includes(datastr)){
    return true;
  }else{
    return false;
  }

}

const readline = require('readline');

/*function newData(query){
  const r1 = readline.createInterface({
      input : process.stdin,
      output : process.stdout,
  });
  return new Promise(resolve => r1.question(query, ans => {
      r1.close();
      resolve(ans);
  }));
}
*/

// Generates a dictionary of `write data value` : `Set of {Notification data values until next write}`
function generateWriteResponsePair(logFile,peripheralId){
  var lastWrite = ''
  // var writeResponsePair = {}
  // var readInterface = readline.createInterface({
  //   input : fs.createReadStream(logFile),
  // })
  // readInterface.on('line',function(line){
  //   //console.log(line);
  //   var arr=line.split('|');
  //   var operator = arr[1].trim();
  //   var serviceUuid = arr[2].trim().split(' ')[0]; //split(' ') to remove optional description
  //   var uuid = arr[3].trim().split(' ')[0];
  //   var data = arr[4].trim().split(' ')[0];
  //   if(operator == '< W'){
  //     //console.log(dict[lastWrite]);
  //     lastWrite = data;
  //     if (!writeResponsePair[lastWrite])
  //       writeResponsePair[lastWrite] = new Set()
  //   }
  //   if(operator == '> N'){
  //     writeResponsePair[lastWrite].add(data);
  //   }
  //   return writeResponsePair;
  //   });
  // console.log(readInterface);
  // console.log(writeResponsePair);
  // return writeResponsePair;
  var remaining = '';
  input = fs.createReadStream(logFile,'utf8');
  input.on('data', function(data) {
    remaining += data;
    var index = remaining.indexOf('\n');
    var last  = 0;
    while (index > -1) {
      var line = remaining.substring(last, index);
      last = index + 1;
      var arr=line.split('|');
      var operator = arr[1].trim();
      var serviceUuid = arr[2].trim().split(' ')[0]; //split(' ') to remove optional description
      var uuid = arr[3].trim().split(' ')[0];
      var data = arr[4].trim().split(' ')[0];
      if(operator == '< W'){
        //console.log(dict[lastWrite]);
        lastWrite = data;
        if (!writeResponsePair[lastWrite])
          writeResponsePair[lastWrite] = new Set()
      }
      if(operator == '> N'){
        writeResponsePair[lastWrite].add(data);
      }
      index = remaining.indexOf('\n', last);
    }

    remaining = remaining.substring(last);

    fs.writeFile(dumpPath+'/'+peripheralId+'.write-response-pair.json',util.inspect(writeResponsePair),'utf-8',
        function (err) {
            if (err) {
                console.error('Crap happens');
            }
        }
    );
  });

  input.on('end', function() {
    if (remaining.length > 0) {
      func(remaining);
    }
  });
}

function loadWriteResponsePair(logFile){
  input = fs.createReadStream(logFile,'utf8');
  var remaining = '';
  input.on('data', function(data) {
    console.log(typeof(data));
    dict = util.inspect(data);
    console.log(typeof(dict));
    console.log(dict);
  });
}


module.exports.myRand = myRand;
module.exports.logToJson = logToJson;
module.exports.parse = parse;
module.exports.match_pattern = match_pattern; 
module.exports.replace = replace;
module.exports.isCertainData = isCertainData;
module.exports.generateWriteResponsePair = generateWriteResponsePair;
module.exports.loadWriteResponsePair = loadWriteResponsePair;