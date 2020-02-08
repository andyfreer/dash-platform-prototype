/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let VMN = module.exports;

/**
 * Virtual Masternode test env
 */

// base classes
VMN.Base = {};
VMN.Base.ModuleBase = require('./lib/base/moduleBase.js');
VMN.Base.ServerModule = require('./lib/base/serverModule.js');

// client modules
VMN.Client = require('./lib/client-module.js');
VMN.DashPayLib = require('../dash-core-daps/dashpay/dashpay-client.js');
VMN.HelloWorldClient = require('../dash-core-daps/helloworld/helloworld-client.js');
VMN.MemoDashClient = require('../dash-core-daps/memodash/memodash-client.js');

// 'backend' modules
VMN.DAPI = require('./lib/dapi-module.js');
VMN.DashDrive = require('./lib/dashdrive-module.js');
VMN.DashCore = require('./lib/dashcore-module.js');
VMN.DB = require('./lib/db-module.js');

// util
VMN.Util = require('./lib/util/vmn-util.js');
VMN.error = require('./lib/util/vmn-error.js');
VMN.TestHelper = require('./lib/util/test-helper.js');

// schema
VMN.Schema = require('../lib/index.js');
