const path = require('path');
const fetch = require('node-fetch');
const { execSync } = require("child_process");
const node_modules = require('node_modules-path');
const packagePath = path.resolve(path.join(node_modules(), '..'));

async function seInfoCommand() {
    let tonosSe = await getTonosSe();
    const status = await tonosSe.status();
    const version = await tonosSe.version();

    const state = status.every(s => s.isRunning) ? "running" : status.every(s => !s.isRunning) ? "exited" : "failed";
    const port = status.find(s => s.serviceName == 'nginx').portStatuses[0].port;
    const dbPort = status.find(s => s.serviceName == 'arango').portStatuses[0].port;

    return { state, version: version["tonos-se-release"], port, dbPort };
}

async function seVersionCommand() {
    let tonosSe = await getTonosSe();
    const version = await tonosSe.version();
    return version["tonos-se-release"];
}

async function seStartCommand() {
    let tonosSe = await getTonosSe();
    await tonosSe.start();
}

async function seStopCommand() {
    let tonosSe = await getTonosSe();
    await tonosSe.stop();
}

async function seResetCommand() {
    let tonosSe = await getTonosSe();
    await tonosSe.reset();
}

async function seSetCommand(version, port, dbPort) {
    if (!version && !port && !dbPort) {
        return;
    }
    let tonosSe = await getTonosSe(version);
    const config = tonosSe.config.get();
    if (port) {
        config['nginx-port'] = parseInt(port);
    }
    if (dbPort) {
        config['arango-port'] = parseInt(dbPort);
    }
    tonosSe.config.set(config);
}

async function getTonosSe(version) {
    if (version) {
        execSync(`npm i --no-save @ton-actions/tonos-se-package@${version === 'latest' ? '' : '_'}${version}`, { cwd: packagePath })
    }
    Object.keys(require.cache).filter(p => p.startsWith('@ton-actions')).forEach(function (key) { delete require.cache[key] })
    return require('@ton-actions/tonos-se-package');
}

async function getAvailableVersions() {
    const res = await fetch('http://registry.npmjs.org/@ton-actions/tonos-se-package');
    const json = await res.json();
    const distTags = json['dist-tags'];

    return Object.entries(distTags)
        .map(t => t[0].replace('_', ''))
        .sort((a, b) => a > b ? 1 : -1);
}

module.exports.seInfoCommand = seInfoCommand;
module.exports.seVersionCommand = seVersionCommand;
module.exports.seStartCommand = seStartCommand;
module.exports.seStopCommand = seStopCommand;
module.exports.seResetCommand = seResetCommand;
module.exports.seSetCommand = seSetCommand;
module.exports.getAvailableVersions = getAvailableVersions;
