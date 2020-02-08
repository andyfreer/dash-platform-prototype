/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let Schema = require('../../../index.js');
let expect = require('chai').expect;
//let util = require('../../util/test-util.js');
let Ajv = require('ajv');

let SysSchema = Schema.System;
//let DapSchema = Schema.Daps.DashPay;

let SomeDapSchema = require('../../daps/somedap.json');

let ajv = new Ajv({allErrors: true});
ajv.addSchema(SysSchema);

let data = {};

describe('Packet tests \n  ---------------------', function () {

    after(function (done) {

        // write the generated data to a json file
        //util.writeTestData(data, 'lib/__tests__/data/', 'packet-test-data');

        done();
    });

    describe('dapcontract packet', function () {

        it('valid dapcontract object', function () {

            let obj = {
                dapcontract: {
                    description: 'valid registration of a new DAP on the chain', // for debugging
                    idx: 0,
                    dapid: 'abcdef',
                    dapname: 'DashPay',
                    dapver: '1',
                    dapschema: SomeDapSchema // here we store the actual schema from above
                }
            };

            let valid = Schema.validate.dapcontract(obj);

            expect(valid.valid).to.be.true;
        });
    });

    describe('dapspace packet', function () {

        it('valid packet', function () {

            let obj = {
                stpacket: {
                    debug: 'valid packet',
                    pver: 1,
                    dapid: '456',
                    dapobjmerkleroot: '123',
                    dapobjects: [
                        {
                            objtype: 'someObject1',
                            id: '1',
                            rev: 1,
                            act: 1,
                            dapobjectid1: 1
                        }
                    ]
                }
            };
            data.validPacket = obj;
            let valid = Schema.validate.stpacket(obj, SomeDapSchema);
            expect(valid.valid).to.be.true;
        });

        it('missing list', function () {

            let obj = {
                stpacket: {
                    pver: 1
                }
            };
            data.invalidPacket = obj;
            let valid = Schema.validate.stpacket(obj, SomeDapSchema);
            expect(valid.valid).to.be.false;
        });
    });

    describe('packet creation', function () {

        it('filter additional fields from dapcontract-contract packet', function () {

            let obj = {
                stpacket: {
                    meta: {id: '123'},
                    unknown1: 1,
                    pver: 1,
                    dapid: '',
                    dapcontract:
                        {
                            unknown2: 1,
                            dapid: 1,
                            dapname: 'DashPay',
                            dapver: '1',
                            dapschema: {}
                        }
                }
            };

            // we have to extract the dapcontract separately as nested
            // additionProperties aren't filtered by AJV
            let schemaObj = Schema.object.fromObject(obj);
            schemaObj.stpacket.dapcontract = Schema.object.fromObject(obj.stpacket.dapcontract);

            ajv.compile(SysSchema);

            expect(!schemaObj.stpacket.unknown1 && !schemaObj.stpacket.dapcontract.unknown2).to.be.true;
        });
    });

    describe('packet instance', function () {

        it('valid dapcontract-contract packet', function () {

            let obj = {
                stpacket: {
                    pver: 1,
                    dapid: '',
                    dapcontract:
                        {
                            dapid: 1,
                            dapname: 'DashPay',
                            dapver: '1'

                        }
                }
            };

            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            expect(valid).to.be.true;
        });

        it('invalid dapobjects packet with null dapobjects', function () {

            let obj = {
                stpacket: {
                    pver: 1,
                    dapid: '123',
                    dapobjmerkleroot: '',
                    meta: {}
                }
            };
            data.createPacket = obj;

            let valid = Schema.validate.stpacket(obj);
            expect(valid.valid).to.be.false;
        });

        it('invalidate multiple packet-content subschemas', function () {

            data.invalid_packet_multi_subschema = {
                stpacket: {
                    pver: 1,
                    dapobjects: [
                        {
                            act: 1,
                            id: '1',
                            rev: 1
                        }
                    ],
                    dapcontract:
                        {
                            dapid: 1,
                            dapname: 'DashPay',
                            dapver: '1',
                            dapschema: {}
                        }
                }
            };
            let valid = Schema.validate.stpacket(data.invalid_packet_multi_subschema);
            expect(valid.valid).to.be.false;
        });

        it('invalid  empty packet', function () {
            let obj = {
                stpacket: {}
            };

            let valid = Schema.validate.stpacket(obj);
            expect(valid.valid).to.be.false;
        });
    });
});

