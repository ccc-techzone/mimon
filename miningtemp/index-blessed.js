const got = require('got');
const parseString = require('xml2js').parseString;
const args = require('commander');
const fs = require('fs');
const blessed = require('blessed');
const contrib = require('blessed-contrib');
const randomColor = require('randomcolor');

let screen = blessed.screen();
let grid = new contrib.grid({rows: 12, cols: 12, screen: screen});

let line = grid.set(0, 0, 6, 12, contrib.line, {
	xPadding: 5,
	label: "GPU temp",
	showLegend: true,
	legend: {width: 20}
});
let log = grid.set(6, 0, 6, 12, blessed.log, {mouse:true});
let graph_data = [];

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


screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();

function genRandColor() {
	let c = randomColor();
	while (graph_data.find(e => e.style.line == c)) {
		c = randomColor();
	}
	return c;
}

function fetch() {
	got(`http://${args.server}:${args.port}/mahm`, { headers: {"Authorization": auth} }).then(response => {
	  parseString(response.body, function(err, result) {
	    display(result);
	  });
	}).catch(error => {
	  console.log(error);
	});
}

function display(result) {
	if (args.verbose) {
		console.log(JSON.stringify(result.HardwareMonitor.HardwareMonitorEntries[0].HardwareMonitorEntry));
	} else {
		for (var entry of result.HardwareMonitor.HardwareMonitorEntries[0].HardwareMonitorEntry) {
			log.log(entry);

			if (!graph_data.find((e) => e.title == entry.localizedSrcName[0])) {
				var series = {
					title: entry.localizedSrcName[0],
					x: [],
					y: [],
				};
				graph_data.push(series);
			}
			var i = graph_data.findIndex((e) => e.title == entry.localizedSrcName[0]);

			if (graph_data[i].y.length > 10)
				graph_data[i].y.shift();
			if (graph_data[i].x.length > 10)
				graph_data[i].x.shift();

			graph_data[i].y.push(Number(entry.data[0]));
			let last_x = graph_data[i].x.length > 0 ? graph_data[i].x[0] : 0;

			graph_data[i].x.push(last_x + 1);
			line.setData(graph_data);
			screen.render();
			//console.log(graph_data);
		}
	}
}