require('env2')('config.env');

var fs = require('fs');
var peripheralId = "c1328c86bef8"
var dumpPath=process.env.DUMP_PATH;
var logFile = dumpPath+ '/'+peripheralId+'.log';
var inputData = fs.createReadStream(logFile,'utf8');
var notificationData = [];
var writeData = [];
var readData = [];
var dspPath = dumpPath+ '/'+peripheralId+'.dsp';
hexToBinary = require('hex-to-binary');

//readLines(inputData,parse);

function myRand(num){
	const random = require("random");
	var value = random.int(1,num);
	console.log(value.toString(16));
}


function readLines(input, func) {
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


module.exports.myRand = myRand;
