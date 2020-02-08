/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */
/*eslint no-console: "off"*/
'use strict';
let VMN = require('../../index.js');
let EventEmitter = require('events');

/**
 * @fileOverview Base class for virtual Masternode stack components with integrated logging
 * @private
 */
class ModuleBase {
    constructor() {

        // tracking highest block
        this.bestBlockInfo = {
            height: 0,
            hash: null
        };

        // generic emitter for derived class events
        this.events = new EventEmitter();

        this.config = {
            'log': {
                'console': false,
                'file': true,
                'logFilePath': './stack.log',
                'trace': 1
            }
        };
    }

    /**
     * Logger (auto logs to browser console or log file in Node)
     * @param msg
     * @param data
     * @param isError
     * @param highlight
     */
    log(msg, data, isError, highlight) {

        function pad(n, str) {
            if (str.length > n) str = str.substr(0, n);
            let outStr = str;
            for (let i = 0; i < (n - str.length); i++) outStr += ' ';
            return outStr;
        }

        try {

            let moduleType = ((Object.getPrototypeOf(this.constructor).name) === 'ServerModule') ? 'VMN' : 'Client';
            let callingModule = this.constructor.name;

            // browser console
            if (typeof window !== 'undefined' && window) {

                let s = moduleType + ' ' + callingModule + ' ' + msg + ': ';
                if (data) {
                    s += pad(65, JSON.stringify(data));
                }
                console.log(s);

            } else if (typeof process === 'object') {

                // log file output
                let colors = {
                    yellow: '\x1b[33m',
                    blue: '\x1b[34m',
                    magenta: '\x1b[35m',
                    red: '\x1b[31m',
                    dim: '\x1b[2m',
                    reset: '\x1b[0m',
                    blink: '\x1b[5m',
                    bright: '\x1b[1m'
                };

                if (this.config.log && this.config.log.console) {

                    let s = (((!isError ? colors.reset : colors.red) + (!highlight ? colors.reset : colors.yellow))
                        + new Date().toLocaleTimeString()
                        + '  ' + pad(6, moduleType)
                        + '  ' + pad(10, callingModule)
                        + ((isError) ? '  ERR: ' : '  ')
                        + pad(22, msg)
                        + colors.reset);

                    if (data) {
                        let dataOut = JSON.stringify(data);

                        if (data.length > 20 && (this.config.log.trace > 1 || this.config.log.trace > 0 && (isError || highlight))) {
                            //console.group(s + '...' + (!highlight ? colors.dim : colors.yellow));
                            //console.log(JSON.parse(dataOut));
                            //console.groupEnd(String(colors.reset));
                        } else {
                            data = JSON.stringify(dataOut);
                            //console.log(s + pad(20, dataOut));
                        }
                    } else {
                        console.log(s);
                    }
                }
                if (this.config.log && this.config.log.file) {
                    let d = new Date();
                    let msgFile = '\n' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds()
                        + '  ' + pad(6, ((Object.getPrototypeOf(this.constructor).name) === 'ServerModule') ? 'MNode' : 'Client')
                        + '  ' + pad(10, this.constructor.name)
                        + ((isError) ? '  ERR: ' : '  ')
                        + pad(22, msg);
                    if (data) msgFile += '\n\t' + data;
                    VMN.Util.appendFile(this.config.log.logFilePath, msgFile);
                }
            }
        } catch (e) {
            //console.log('log error: ' + e);
        }
    }

    logError(msg, data) {
        this.log(msg, data, true);
    }

    logInfo(msg, data) {
        this.log(msg, data, false, true);
    }

    cleanLog() {
        if (typeof window === 'undefined' && typeof process === 'object') {
            VMN.Util.deleteFile(this.config.log.logFilePath);
        }
    }
}

module.exports = ModuleBase;
