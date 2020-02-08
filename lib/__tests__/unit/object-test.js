/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let Schema = require('../../index.js');
let expect = require('chai').expect;

describe('Schema.object unit tests\n  ---------------------', function () {

    // test data factories
    let dapObj = function () {
        return {
            someprop: 1
        };
    };

    let sysObj = function () {
        return {
            subtx: {
                someprop: 1
            }
        };
    };

    describe('Object Instantiation', function () {

        it('cloning strips additional properties');
    });

    describe('Object JSON', function () {

        it('json tests');

    });

    describe('Meta data', function () {

        let metaObj = {
            someprop: 1
        };

        it('create metadata', function () {
            Schema.object.setMeta(metaObj, 'somekey', 1);
            expect(metaObj.meta.somekey).to.equal(1);
        });
        it('append metadata', function () {
            Schema.object.setMeta(metaObj, 'somekey2', 2);
            expect(metaObj.meta.somekey2).to.equal(2);
        });

        it('set sysobject id');

        it('set dapobject id');
    });

    describe('Object classification', function () {

        it('system object', function () {
            expect(Schema.object.isSysObject(sysObj())).to.be.true;
        });
        it('dap object', function () {

            expect(Schema.object.isSysObject(dapObj())).to.be.false;
        });
        it('empty object', function () {
            let obj = {};
            expect(Schema.object.isSysObject(obj)).to.be.false;
        });
        it('not an object: number', function () {
            let obj = 1;
            expect(Schema.object.isSysObject(obj)).to.be.false;
        });
        it('not an object: string', function () {
            let obj = '1';
            expect(Schema.object.isSysObject(obj)).to.be.false;
        });
        it('not an object: null', function () {
            let obj = null;
            expect(Schema.object.isSysObject(obj)).to.be.false;
        });
        it('not an object: undefined', function () {
            expect(Schema.object.isSysObject()).to.be.false;
        });
        it('not an object: function', function () {
            let obj = function () {
                return 1;
            };
            expect(Schema.object.isSysObject(obj)).to.be.false;
        });
    });
});
