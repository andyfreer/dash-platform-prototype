/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let Schema = require('../../../index.js');
let expect = require('chai').expect;

describe('DapSchema tests \n  ---------------------', function () {

    describe('Invalid dap schemas', function () {

        it('missing meta schema', function () {
            const dapSchema = {};
            const valid = Schema.compile.dapschema(dapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.invalid_metaschema);
        });

        it('missing schema title', function () {
            const dapSchema = {
                '$schema': Schema.params.dapSchemaMetaURI,
            };
            const valid = Schema.compile.dapschema(dapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.invalid_schema_title);
        });

        it('schema title too short', function () {
            const dapSchema = {
                '$schema': Schema.params.dapSchemaMetaURI,
                'title': 'ab'
            };
            const valid = Schema.compile.dapschema(dapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.invalid_schema_title);
        });

        it('schema title too long', function () {
            const dapSchema = {
                '$schema': Schema.params.dapSchemaMetaURI,
                'title': 'abcdefghijklmnopqrstuvwxy'
            };
            const valid = Schema.compile.dapschema(dapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.invalid_schema_title);
        });
    });

    describe('Invalid dap subschema names', function () {

        it('no subchemas', function () {
            const dapSchema = {
                '$schema': Schema.params.dapSchemaMetaURI,
                'title': 'abcdef'
            };
            const valid = Schema.compile.dapschema(dapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.invalid_dap_subschema_count);
        });

        it('more than max dap subschemas', function () {
            const dapSchema = {
                '$schema': Schema.params.dapSchemaMetaURI,
                'title': 'abcdef'
            };

            for (let i = 0; i < 1001; i++) {
                dapSchema['subschema' + i] = {};
            }
            const valid = Schema.compile.dapschema(dapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.invalid_dap_subschema_count);
        });

        it('invalid dap subchema name (reserved params keyword)', function () {
            const dapSchema = {
                '$schema': Schema.params.dapSchemaMetaURI,
                'title': 'abcdef',
                'type': '1'
            };
            const valid = Schema.compile.dapschema(dapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.reserved_dap_subschema_name);
        });

        it('invalid dap subchema name (reserved sysobject keyword)', function () {
            const dapSchema = {
                '$schema': Schema.params.dapSchemaMetaURI,
                'title': 'abcdef',
                'subtx': '1'
            };
            const valid = Schema.compile.dapschema(dapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.reserved_dap_subschema_name);
        });

        it('invalid dap subchema name (reserved syschema definition keyword)', function () {
            const dapSchema = {
                '$schema': Schema.params.dapSchemaMetaURI,
                'title': 'abcdef',
                'dapobjectbase': '1'
            };
            const valid = Schema.compile.dapschema(dapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.reserved_dap_subschema_name);
        });

        // invalid chars in property name
        it('invalid dap subchema name (disallowed characters)', function () {
            const dapSchema = {
                '$schema': Schema.params.dapSchemaMetaURI,
                'title': 'abcdef',
                '#': '1'
            };
            const valid = Schema.compile.dapschema(dapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.invalid_dap_subschema_name);
        });

        it('invalid dap subchema name (below min length)', function () {
            const dapSchema = {
                '$schema': Schema.params.dapSchemaMetaURI,
                'title': 'abcdef',
                'ab': '1'
            };
            const valid = Schema.compile.dapschema(dapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.invalid_dap_subschema_name);
        });

        it('invalid dap subchema name (above max length)', function () {
            const dapSchema = {
                '$schema': Schema.params.dapSchemaMetaURI,
                'title': 'abcdef',
                'abcdefghijklmnopqrstuvwxy': '1'
            };
            const valid = Schema.compile.dapschema(dapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.invalid_dap_subschema_name);
        });
    });

    describe('Invalid dap subschema contents', function () {

        it('missing DAP subschema inheritance', function () {
            const dapSchema = {
                '$schema': Schema.params.dapSchemaMetaURI,
                'title': 'abcdef',
                'someobject': '1'
            };
            const valid = Schema.compile.dapschema(dapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.dap_subschema_inheritance);
        });

        it('invalid DAP subschema inheritance (missing allOf)', function () {
            const dapSchema = {
                '$schema': Schema.params.dapSchemaMetaURI,
                'title': 'abcdef',
                'someobject': {
                    //'allOf': [{'$ref': 'unknown'}],
                }
            };
            const valid = Schema.compile.dapschema(dapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.dap_subschema_inheritance);
        });

        it('invalid DAP subschema inheritance (invalid type)', function () {
            const dapSchema = {
                '$schema': Schema.params.dapSchemaMetaURI,
                'title': 'abcdef',
                'someobject': {
                    'allOf': {'$ref': Schema.params.dapObjectBaseRef},
                }
            };
            const valid = Schema.compile.dapschema(dapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.dap_subschema_inheritance);
        });

        it('invalid DAP subschema inheritance (missing $ref)', function () {
            const dapSchema = {
                '$schema': Schema.params.dapSchemaMetaURI,
                'title': 'abcdef',
                'someobject': {
                    'allOf': [{}],
                }
            };
            const valid = Schema.compile.dapschema(dapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.dap_subschema_inheritance);
        });

        it('invalid DAP subschema inheritance (unknown $ref)', function () {
            const dapSchema = {
                '$schema': Schema.params.dapSchemaMetaURI,
                'title': 'abcdef',
                'someobject': {
                    'allOf': [{'$ref': 'unknown'}],
                }
            };
            const valid = Schema.compile.dapschema(dapSchema);
            expect(valid.errCode).to.equal(Schema.rules.types.dap_subschema_inheritance);
        });
    });
});
