/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let VMN = require('../../index.js');

// singleton instances per derived type
let typeInstance = [];

/**
 * @fileOverview Singleton base class for 'Server' stack modules
 *
 * Classes that extend ServerModule have a single global instance and an optional shared db for session storage per type.
 * @private
 */
class ServerModule extends VMN.Base.ModuleBase {
    constructor() {
        super();

        // instantiate singleton per derived type
        let instName = this.constructor.name;
        if (!typeInstance[instName]) {

            // always return a single type instance for this type
            typeInstance[instName] = this;

            // implemented in derived classes to provide
            // single derived constructor code per type
            this.singletonConstructor();
        }

        return typeInstance[instName];
    }


    /**
     * Delete the stack by destroying typeInstances
     */
    static cleanStack() {
        for (let key in typeInstance) {
            typeInstance[key] = null;
            delete typeInstance[key];
        }
    }
}

module.exports = ServerModule;
