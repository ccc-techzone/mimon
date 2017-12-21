const blessed = require('blessed');
const contrib = require('blessed-contrib');

let screen = blessed.screen({smartCSR: true});
let grid = new contrib.grid({rows: 12, cols: 12, screen: screen});

let list = grid.set(0, 0, 12, 3, blessed.list, {
	items: ["Hello", "World", "Foo", "Bar"],
	mouse: true,
	interactive: true,
	keys: true,
	vi: true,
	style: {
		selected: {bg: 'white', fg: 'black'}
	}
}).focus();

let logger = grid.set(0, 3, 12, 9, contrib.log, {});

logger.log("Hello");
logger.log("World");
logger.log({foo: "bar", baz: "foo"});

list.on("select", function(e, i) {
	screen.render();
})

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();
