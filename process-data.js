require('env2')('config.env');

var fs = require('fs');
var utilities = require('./utilities.js');
var getopt = require('node-getopt');

var options = new getopt([
	['d', 'device=short', 'device address']
]);

options.setHelp("Usage: node process-data -d 'address'\n");
opt = options.parseSystem();
var peripheralId = opt.options.device;
//console.log(peripheralId);

var dumpPath = process.env.DUMP_PATH;
var logFile = dumpPath+ '/'+peripheralId+'.log';
var inputData = fs.createReadStream(logFile,'utf8');

utilities.logToJson(inputData, utilities.parse, peripheralId)
