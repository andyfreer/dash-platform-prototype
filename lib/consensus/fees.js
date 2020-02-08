/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */
'use strict';
/**
 * @fileOverview Consensus code for Credit Fees
 * @module Schema.create
 */
//let Schema = require('../index.js');

function calcSTFees(feePerByte) {

    return Number(feePerByte) * 1;
}


module.exports = {
    calcSTFees: calcSTFees
};
