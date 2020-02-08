/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let Schema = require('../../../index.js');
let expect = require('chai').expect;

describe('SysSchema tests \n  ---------------------', function () {

    describe('Valid sys schemas', function () {

        it('valid sys schema', function () {
            const sysSchema = {};
            const valid = Schema.compile.sysschema(sysSchema);
            expect(valid.valid).to.be.true;
        });
    });

    describe('Invalid sys schemas', function () {

        it('invalid meta schema');
    });

    describe('Base Objects', function () {

        it('all subschemas inherit sysobjectbase');
    });

    describe('Root schema', function () {

        it('oneOf enforces single subschema');
    });

    describe('Subchema', function () {

        it('all subschemas disallow additional properties');

        it('all subschemas inherit sysobjectbase');
    });
});
