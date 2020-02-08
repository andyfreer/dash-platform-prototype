/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let Schema = require('../../../index.js');
let expect = require('chai').expect;
let DapSchema = require('../../daps/somedap.json');

describe('DAP Objects\n  ---------------------', function () {

    describe('valid dapobjects', function () {

        it('valid dapobject 1', function () {

            let obj = {
                objtype: 'someObject1',
                id: '1',
                rev: 1,
                act: 1,
                dapobjectid1: 1
            };

            let valid = Schema.validate.dapobject(obj, DapSchema);
            expect(valid.valid).to.be.true;
        });

        it('valid dapobject 2', function () {

            let obj = {
                objtype: 'someObject2',
                id: '1',
                rev: 1,
                act: 1,
                dapobjectid2: 1
            };

            let valid = Schema.validate.dapobject(obj, DapSchema);
            expect(valid.valid).to.be.true;
        });
    });

    describe('dapobject properties', function () {

        it('allow additional properties', function () {

            let obj = {
                objtype: 'someObject1',
                id: '1',
                rev: 1,
                act: 1,
                dapobjectid1: 1,
                someAdditionalProp: 1
            };

            let valid = Schema.validate.dapobject(obj, DapSchema);
            expect(valid.valid).to.be.true;
        });

        it('missing inherited properties', function () {

            let obj = {
                objtype: 'someObject1',
                dapobjectid1: 1
            };

            let valid = Schema.validate.dapobject(obj, DapSchema);
            expect(valid.valid).to.be.false;
        });

        it('missing local properties', function () {

            let obj = {
                objtype: 'someObject1',
                id: '1',
                rev: 1,
                act: 1,
            };

            let valid = Schema.validate.dapobject(obj, DapSchema);
            expect(valid.valid).to.be.false;
        });
    });

    describe('dapobject type', function () {

        it('missing object type', function () {

            let obj = {
                id: '1',
                rev: 1,
                act: 1,
                dapobjectid1: 1
            };

            let valid = Schema.validate.dapobject(obj, DapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.dapobject_missing_objtype);
        });

        it('unknown object type', function () {

            let obj = {
                objtype: 'missing object!',
                id: '1',
                rev: 1,
                act: 1,
                dapobjectid1: 1
            };

            let valid = Schema.validate.dapobject(obj, DapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.dapobject_unknown_objtype);
        });

        it('mismatched object type', function () {

            let obj = {
                objtype: 'someObject2',
                id: '1',
                rev: 1,
                act: 1,
                dapobjectid1: 1
            };

            let valid = Schema.validate.dapobject(obj, DapSchema);
            expect(valid.valid).to.be.false;
        });
    });
});
