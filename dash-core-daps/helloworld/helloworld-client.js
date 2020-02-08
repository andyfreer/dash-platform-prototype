/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let VMN = require('../../dash-vmn/index.js');

/**
 * HellowWorld DAP Client
 */
class HelloWorldClient extends VMN.Client {

    /**
     *  ------------------------
     *  Events
     *  ------------------------
     */

    onStart() {
        // initialize any internal data structures specific to this DAP during Ctor
        // ..todo..
    }

    async onUpdate() {
        // process updated local DapContext state from DAPI
        // ..todo..
    }

    /**
     *  ------------------------
     *  State Derivation
     *  ------------------------
     */

    /**
     *  ------------------------
     *  Queries
     *  ------------------------
     */

    /**
     *  ------------------------
     *  Actions
     *  ------------------------
     */

}

module.exports = HelloWorldClient;
