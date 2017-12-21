const got = require('got');
const parseString = require('xml2js').parseString;
const term = require('terminal-kit').terminal;
const args = require('commander');
const fs = require('fs');

args
	.version("0.1.0")
	.option("-s, --server [ip]", "Server IP address")
	.option("-p, --port [port]", "Server port", 82)
	.option("-u, --username [username]", "RemoteServer username", "MSIAfterburner")
	.option("-p, --password [password]", "RemoteServer password", "17cc95b4017d496f82")
	.option("-t, --time [ms]", "Update time interval [ms]", "100")
	.option("-l, --log [file]", "Log to [file]")
	.option("-v, --verbose", "Show textual output")
	.parse(process.argv);

if (!args.server) {
	console.log("-s or --server [ip] is required!");
	args.help();
}


var auth = 'Basic ' + new Buffer(args.username + ':' + args.password).toString('base64');

setInterval(fetch, args.time);

function fetch() {
	got(`http://${args.server}:${args.port}/mahm`, { headers: {"Authorization": auth} }).then(response => {
	  parseString(response.body, function(err, result) {
	    display(result);

	    if (args.log) {
	    	log(result);
	    }
	  });
	}).catch(error => {
	  console.log(error.response.body);
	});
}

function display(result) {
	if (args.verbose) {
		console.log(JSON.stringify(result.HardwareMonitor.HardwareMonitorEntries[0].HardwareMonitorEntry));
	} else {
		term.clear();
		for (var entry of result.HardwareMonitor.HardwareMonitorEntries[0].HardwareMonitorEntry) {
			term.red.bold(entry.localizedSrcName[0]);
			term.green(" (%f %s)\t", Math.round(entry.data[0] * 100) / 100, entry.localizedSrcUnits[0])
			term.column(35);
			term.bar(Number(entry.data[0]) / Number(entry.maxLimit[0]), {innerSize: 40, barStyle: term.green});
			term.nextLine();
		}
	}
}

function log(result) {
	fs.appendFile(args.log, JSON.stringify(result.HardwareMonitor.HardwareMonitorEntries[0].HardwareMonitorEntry));
}
