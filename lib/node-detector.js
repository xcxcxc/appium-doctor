import {fs, cp} from './utils';
import {default as log} from './logger';
import path from 'path';

const NODE_COMMON_PATHS = [
  process.env.NODE_BIN,
  '/usr/local/bin/node',
  '/opt/local/bin/node',
];

class NodeDetector {
  async retrieveInCommonPlaces () {
    for(let p of NODE_COMMON_PATHS) {
      if (p && await fs.exists(p)) {
        log.info(`Node binary found at common place {p}.`);
        return p;
      }
    }
    log.info('Node binary wasn\'t found at common places.');
    return null;
  }

  async retrieveUsingWhichCommand () {
    let stdout;
    try {
      [stdout] = await cp.exec("which node", { maxBuffer: 524288});
    } catch (ign) {}
    let nodePath = stdout.replace("\n", "");
    if(await fs.exists(nodePath)) {
      log.info("Node binary found using which command at " + nodePath);
      return nodePath;
    } else {
      log.info('Node binary not found using the which command.');
      return null;
    }
  }

  async retrieveUsingAppleScript () {
    var appScript = [
      'try'
      , '  set appiumIsRunning to false'
      , '  tell application "System Events"'
      , '    set appiumIsRunning to name of every process contains "Appium"'
      , '  end tell'
      , '  if appiumIsRunning then'
      , '    tell application "Appium" to return node path'
      , '  end if'
      , 'end try'
      , 'return "NULL"'
    ].join("\n");
    let stdout;
    try {
      [stdout] = await cp.exec("osascript -e '" + appScript + "'", { maxBuffer: 524288});
    } catch(ign) {}
    let nodePath = stdout.replace("\n", "");
    if(await fs.exists(nodePath)) {
      log.info("Node binary found using AppleScript at " + nodePath);
      return nodePath;
    } else {
      log.info('Node binary not found using AppleScript.');
      return null;
    }
  }

  async retrieveUsingAppiumConfigFile () {
    let jsonobj;
    try {
      var appiumConfigPath = path.resolve(__dirname, "../..", ".appiumconfig.json");
      if(await fs.exists(appiumConfigPath)) {
        jsonobj = JSON.parse(await fs.readFile(appiumConfigPath, 'utf8'));
      }
    } catch (ign) {}
    if(jsonobj && jsonobj.node_bin && await fs.exists(jsonobj.node_bin) ) {
      log.info("Node binary found using .appiumconfig.json at " + jsonobj.node_bin);
      return jsonobj.node_bin;
    } else {
      log.info('Node binary not found in the .appiumconfig.json file.');
      return null;
    }
  }

  async detect () {
    let nodePath = await this.retrieveInCommonPlaces() ||
      await this.retrieveUsingWhichCommand() ||
      await this.retrieveUsingAppleScript() ||
      await this.retrieveUsingAppiumConfigFile();
    if (nodePath) {
      return nodePath;
    } else {
      log.warn('The node binary could not be found.');
      return null;
    }
    // TODO: re-implement setupNodeBinaryPath, but not here
  }
}

export default NodeDetector;