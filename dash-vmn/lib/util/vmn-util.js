/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let VMN = require('../../index.js');
let fs = require('fs');

/**
 * Destroy stack and clean all persisted data and logs
 *
 * (Safe stack destruction is needed due to the singleton instancing)
 * @private
 */
function reset() {
    let da = new VMN.DAPI();
    da.db.cleanDB();
    da.cleanLog();
    VMN.DashCore.cleanStack();
}

function appendFile(path, msg) {
    fs.appendFile(path, msg, function (err) {
        if (err) throw err;
    });
}

function deleteFile(path) {
    if (fs) {
        if (fs.existsSync(path)) {
            fs.unlink(path, function (err) {
                if (err) throw err;
            });
        }
    }
}

/**
 * Write JSON to file
 * @private
 * @method writeJSONFile
 * @param {} filename
 * @param {} data
 * @param {} path
 */
function writeJSONFile(filename, data, path) {
    const content = JSON.stringify(data, null, 4);

    fs.writeFile(path + '/' + filename + '.json', content, 'utf8', function (err) {
        if (err) {
            throw (err);
        }
    });
}

/**
 * Read JSON from file
 * @private
 * @method readJSONFile
 * @param {} filename
 * @param {} path
 */
function readJSONFile(filename, path) {

    fs.readFile(path + '/' + filename + '.json', 'utf8', function (err, data) {
        if (err) {
            throw (err);
        } else {
            return data;
        }
    });
}

module.exports = {
    writeJSONFile: writeJSONFile,
    readJSONFile: readJSONFile,
    reset: reset,
    appendFile: appendFile,
    deleteFile: deleteFile
};
