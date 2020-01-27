require('env2')('../config.env');
utilities = require('../utilities');
var fs = require('fs');
var colors = require('colors');
var utils = require('../lib/utils');
var dumpPath=process.env.DUMP_PATH;

var actNotify = false;
var actWrite = '';
var started = false;
var notify_cnt = 0;

String.prototype.replaceAt = function(index,replacement){
	return this.substr(0,index) + replacement + this.substr(index + replacement.length);
}

function myRand(num){
	const Random = require('random-js');
	const random = new Random.Random();
	const value = random.integer(1,num);
	return value.toString(16);
}
function customLog(peripheralId, service, characteristic, type, data, eventEmitter, callback){

	console.log('customLog hook');
	var toSave = '';

	switch (type){
		case 'read': toSave +='< R: '; break;
		case 'write': toSave +='> W: '; break;
		case 'notify': toSave +='< N: '; break;
	}
	toSave += characteristic + ' : ' + data.toString('hex') + ' ('+utils.hex2a(data.toString('hex'))+')\n';
  	fs.appendFile("dump/save", toSave, function(err) {
    	if(err) {
    		//todo: to callback
        	return console.log(err);
    	}
    //console.log("The file was saved!");
  	}); 

  	callback(null, data);
}



function posNotify(peripheralId, service, characteristic, type, data, notifyEmitter, callback){

	console.log('    dynamic notify hook'.yellow);
	datastr = data.toString('hex');

	console.log('    data' + datastr);

	callback(null, new Buffer(datastr,'hex'));

}


function relayWrite(peripheralId, service, characteristic, type, data, wsclient, callback){

	posWriteHacked(peripheralId, service, characteristic, type, data, wsclient, callback);

}


function posWriteHacked(peripheralId, service, characteristic, type, data, wsclient, callback){
	datastr = data.toString('hex');
	if (actWrite === 'displayswitch') {
		datastr='62790cff0c0c0efc5365637552696e672e706c0c'
		console.log('    Switch text                                                                 : '.red  + datastr.red.inverse + '(' + utils.hex2a(datastr)+')');
		actWrite='';
		callback(null, new Buffer(datastr,'hex'));
		wsclient.write(peripheralId, service,characteristic, new Buffer('ff0ef8a361030e0f','hex'),false)
	}
	else if (datastr.substring(0,10) === '020c190301')  { // "enter card"
		actWrite='displayswitch';
		datastr = '020c2403010b0c0c0c020c0efa4861636b656420'
		console.log('    Switch text                                                                 : '.red  + datastr.red.inverse + '(' + utils.hex2a(datastr)+')');
		callback(null, new Buffer(datastr,'hex'));

	} else {
		console.log('             pos write hook - forwarding without modification                   : '.yellow + datastr.yellow.inverse);
		callback(null, data);
	}
}




function posWriteBH(peripheralId, service, characteristic, type, data, wsclient, callback){
	datastr = data.toString('hex');
	if (actWrite === 'displayswitch') {
		datastr='2067726565740cff0ef8a84f030e0f'
		console.log('    Switch text                                                                 : '.red  + datastr.red.inverse + ' (' + utils.hex2a(datastr)+')');
		actWrite='';
		callback(null, new Buffer(datastr,'hex'));
	}
	else if (datastr.substring(0,10) === '020c190301')  { // "enter card"
		actWrite='displayswitch';
		datastr = '020c1903010b0c0c0c010c0f426c61636b486174'
		console.log('    Switch text                                                                 : '.red  + datastr.red.inverse + ' (' + utils.hex2a(datastr)+')');
		callback(null, new Buffer(datastr,'hex'));

	} else {
		console.log('             pos write hook - forwarding without modification                   : '.yellow + datastr.yellow.inverse);
		callback(null, data);
	}
}


function staticNotify(peripheralId, service,characteristic,type,data, wsclient,callback){
	datastr = data.toString("hex");
	if (datastr === "16000480"){
		started = true;
	}
	console.log("	dynamic notify hook".yellow);
	console.log("	data" + datastr);
	if (started == false){
		callback(null, new Buffer(datastr,'hex'));
	} else {
		callback(null, new Buffer("400a0461057670177ad00cc8f0056d610ea0a00d",'hex'));
	}
}

function replayNotify(peripheralId, service, characteristic, type, data, wsclient, callback){
	var notifyData = JSON.parse(fs.readFileSync(dumpPath+"/"+peripheralId.toString().toLowerCase()+".notify.json", 'utf8'));
	datastr = data.toString('hex');
	console.log("	Dynamic Notify".yellow);
	tempstr = notifyData[notify_cnt].replaceAt(4,'F');
	tempstr = tempstr.replaceAt(5,'F');
	callback(null,new Buffer(tempstr,'hex'));
	notify_cnt = notify_cnt + 1;
	if (notify_cnt > notifyData.length){
		notify_cnt = 0;
	}
}

function dynamicNotify(peripheralId, service, characteristic, type, data, wsclient, callback){
	datastr = data.toString('hex');
	if (datastr.length == 20){
		console.log("	Dynamic Notify Length 20".yellow);
		datastr = datastr.replaceAt(2,myRand(15));
		datastr = datastr.replaceAt(3,myRand(15));
		datastr = datastr.replaceAt(4,myRand(15));
	}
	callback(null, new Buffer(datastr,'hex'));

}

function dynamicRead(peripheralId, service, characteristic, type, data, wsclient, callback){
	datastr = data.toString("hex");
	callback(null,new Buffer(datastr,'hex'));
}
module.exports.staticNotify = staticNotify;
module.exports.replayNotify = replayNotify;
module.exports.dynamicNotify = dynamicNotify;
module.exports.dynamicRead = dynamicRead;
