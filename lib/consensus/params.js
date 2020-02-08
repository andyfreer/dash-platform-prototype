/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
/**
 * @fileOverview Consensus Parameters
 * @module Schema.params
 */
//let Schema = require('../index.js');

module.exports = {
    dapSchemaMetaURI: 'http://dash.org/schemas/dapschema',
    sysSchemaMetaURI: 'http://dash.org/schemas/sys',
    sysSchemaId: 'http://dash.org/schemas/sys',
    dapMetaSchema: 'http://dash.org/schemas/sys',
    reservedKeywords: ['type'],
    dapObjectBaseRef: 'http://dash.org/schemas/sys#/definitions/dapobjectbase',
    dapSchemaMaxSize: 10000
};
