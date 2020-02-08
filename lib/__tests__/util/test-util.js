/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */
'use strict';
/**
 * @fileOverview Test util
 * @private
 */
let fs = require('fs');

function writeTestData(data, relPath, fileName) {

    // write the generated data to a json file
    let content = JSON.stringify(data, null, 4);
    fs.writeFile(relPath + fileName + '.json', content, 'utf8', function (err) {
        if (err) {
            throw (err);
        }
    });
}

module.exports = {
    writeTestData: writeTestData
};
