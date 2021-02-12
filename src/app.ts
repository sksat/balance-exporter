console.log("start");

import * as express from 'express';
import * as prom from 'prom-client';
const fs = require('fs');
const path = require('path');
const toml = require('@iarna/toml');
const cron = require('node-cron');

const root = require('app-root-path');
const plugin_dir = root + "/plugins";

const app = express();

const config_file = fs.readFileSync(root+"/config.toml");
const config = toml.parse(config_file);

prom.collectDefaultMetrics();

const gauge = new prom.Gauge({
	name: "balance",
	help: "help",
	labelNames: ["target", "property"],
});

const plugin = Object.create(null);
fs.readdirSync(plugin_dir).forEach(file => {
	if (path.extname(file) !== '.js') {
		return;
	}
	plugin[file.slice(0, -3)] = path.join(plugin_dir, file);
});

console.log("enabled plugin: " + config.plugin.enabled);
Object.keys(plugin).filter((id) => {
	//return true;// enabled_plugin.inclues(id);
	const enabled = config.plugin.enabled;
	if (enabled === "all") {
		return true;
	}
	return enabled.includes(id);
}).forEach((id) => {
	console.log("attach plugin: "+id);
	const p = require(plugin[id]);
	const balance  = p.balance;
	const cfg = config.plugin[id];

	if (! (typeof balance === 'function')){
		console.log("plugin="+id+": function not found("+ typeof balance + ")");
	}
	if (cfg === undefined) {
		throw "plugin config is undefined: " + id;
	}
	if (! cron.validate(cfg.cron)) {
		console.log("cron is invalid: "+cfg.cron);
	}

	const fn = async() => {
		const ret = await balance(cfg.login);
		if (ret instanceof Array){
			//console.log("tuple");
			const b = ret[0];
			const props = ret[1];
			console.log("balance[" + id + "]: " + b);
			gauge.labels(id, "balance").set(b);

			for (const p of props){
				console.log("balance[" + id + ":" + p[0] + "]: " + p[1]);
				gauge.labels(id, p[0]).set(p[1]);
			}
		}else{
			//console.log("not tuple");
			console.log("balance[" + id + "]: " + ret);
			gauge.labels(id, "").set(ret);
		}
	};

	(async () =>{await fn()})();
	cron.schedule(cfg.cron, fn);
})

app.get('/hello', (req, res) => {
	res.status(200).send({ message: 'hello, world' });
});

app.use('/metrics', async (req, res) => {
	const { getSummary, getContentType } = require('@promster/express');
	req.statusCode = 200;

	res.setHeader('Content-Type', getContentType());
	res.end(await getSummary());
});

const port = config.prometheus.port;
app.listen(port);
console.log('listen on port ' + port);
