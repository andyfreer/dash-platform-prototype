/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let expect = require('chai').expect;
let Ajv = require('ajv');

/**
 *  Here we test JSON schema draft compatibility with Dash schema patterns
 *  using a simplified inline Dash System schema and later with a single extended DAP schema
 *
 *  Current JSON schema spec is draft #7:
 *  http://json-schema.org/draft-07/schema#
 *
 *  NOTES:
 *
 *  - additionalProperties keyword is used for System and Dap Schema root properties but not for subschemas
 *    this means objects can have additional properties and still validate, therefore the pattern is to ignore
 *    additional properties not specified in the schema in consensus code
 *
 *  - ...we use $ref and definitions section for schema inheritance
 */

/**
 * Simplified System Schema abstracting the core patterns used in the production schema
 * @private
 */
let SysSchema = {
    '$schema': 'http://json-schema.org/draft-07/schema#',
    '$id': 'http://dash.org/schemas/sys',
    'type': 'object',
    // internal definitions for referencing
    'definitions': {
        'objectbase': {
            'type': 'object',
            'properties': {
                'objectbaseid': {
                    'type': 'number'
                }
            },
            'required': [
                'objectbaseid'
            ]
        },
        'sysobjectbase': {
            'type': 'object',
            // inherit from the base object
            'allOf': [{'$ref': '#/definitions/objectbase'}],
            'properties': {
                'sysobjectbaseid': {
                    'type': 'number'
                }
            },
            'required': [
                'sysobjectbaseid'
            ]
        },
        'dapobjectbase': {
            'type': 'object',
            // inherit from a derived object
            'allOf': [{'$ref': '#/definitions/objectbase'}],
            'properties': {
                'dapobjectbaseid': {
                    'type': 'number'
                }
            },
            'required': [
                'dapobjectbaseid'
            ]
        },
        'dapcontractbase': {
            'type': 'object',
            // inherit from a derived object
            'allOf': [{'$ref': '#/definitions/objectbase'}],
            'properties': {
                'dapcontract': {
                    'type': 'object',
                    'properties': {
                        'dapcontractid': {
                            'type': 'number'
                        }
                    },
                    'required': [
                        'dapcontractid'
                    ]
                }
            },
            'required': [
                'dapcontract'
            ]
        }
    },
    // instantiable subschemas
    'properties': {
        'sysobjectchild': {
            'type': 'object',
            // inherit base from definitions
            'allOf': [{'$ref': '#/definitions/sysobjectbase'}],
            'properties': {
                'sysobjectchildid': {
                    'type': 'number'
                }
            },
            'required': [
                'sysobjectchildid'
            ]
        },

        'dapobjectcontainer': {
            'type': 'object',
            'allOf': [{'$ref': '#/definitions/sysobjectbase'}],

            'oneOf': [
                {
                    '$ref': '#/definitions/dapcontractbase'
                },
                {
                    'properties': {
                        'dapobjects': {
                            'type': 'array',
                            'uniqueItems': true,
                            'minItems': 1,
                            'items': {
                                'oneOf': [{
                                    'type': 'object',
                                    'patternProperties': {
                                        '^.*$': {
                                            'allOf': [{'$ref': '#/definitions/dapobjectbase'}]
                                        }
                                    },
                                    'additionalProperties': false
                                }]
                            }
                        }
                    },
                    'required': [
                        'dapobjects'
                    ]
                    //"$ref": "#/properties/dapobjectsxx"
                },
                {
                    'properties': {
                        'sysmod': {
                            'type': 'object',
                            'properties': {
                                'sysmodid': {
                                    'type': 'number'
                                }
                            },
                            'required': [
                                'sysmodid'
                            ]
                        }
                    },
                    'required': [
                        'sysmod'
                    ]
                    //"$ref": "#/properties/dapobjectsxx"
                }
            ],

            'properties': {
                'dapobjectcontainerid': {
                    'type': 'number'
                },
                'contents': {
                    'type': 'number'
                },
            },
            'required': [
                'dapobjectcontainerid'/*,
                "dapobjects"*/
            ]
        }
    },
    // valid schema objects can only specify a single subschema type
    'oneOf': [
        {
            'required': [
                'sysobjectchild'
            ]
        },
        {
            'required': [
                'dapobjectcontainer'
            ]
        }
    ],
    'additionalProperties': false
};

// Simplifed DAP Schema. DapSchemas are blockchainuser generated and alwaqys extend the System Schema
let DapSchema = {
    '$id': 'http://dash.org/schema/dapcontract',
    'properties': {
        'dapobjectchild': {
            'type': 'object',
            'allOf': [{'$ref': 'http://dash.org/schemas/sys#/definitions/dapobjectbase'}],
            'properties': {
                'dapobjectid': {
                    'type': 'number',
                }
            },
            'required': [
                'dapobjectid'
            ]
        }
    },
    'oneOf': [
        {
            'required': [
                'dapobjectchild'
            ]
        }
    ],
    'additionalProperties': false
};


let ajv = new Ajv({allErrors: true});
ajv.addSchema(SysSchema);

function validateObject(obj, dapSchema) {

    let validate = ajv.compile(dapSchema ? dapSchema : SysSchema);
    let valid = validate(obj);
    return valid;
}

describe('JSON Schema draft\n  ---------------------', function () {

    describe('system schema', function () {

        it('valid inherited sys object', function () {

            let obj = {
                sysobjectchild: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    sysobjectchildid: 1
                }
            };

            expect(validateObject(obj)).to.be.true;
        });

        it('missing required field', function () {

            let obj = {
                sysobjectchild: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    sysobjectchildid: null
                }
            };

            expect(validateObject(obj)).to.be.false;
        });
        it('missing required field in super', function () {

            let obj = {
                sysobjectchild: {
                    objectbaseid: 1,
                    sysobjectbaseid: null,
                    sysobjectchildid: 1
                }
            };

            expect(validateObject(obj)).to.be.false;
        });
        it('missing required field in base', function () {

            let obj = {
                sysobjectchild: {
                    objectbaseid: null,
                    sysobjectbaseid: 1,
                    sysobjectchildid: 1
                }
            };

            expect(validateObject(obj)).to.be.false;
        });

        it('no valid schema', function () {

            let obj = {
                sysobjectchild2: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    sysobjectchildid: 1
                }
            };

            expect(validateObject(obj)).to.be.false;
        });

        it('prevent additional properties in main sys schema', function () {

            let obj = {
                sysobjectchild: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    sysobjectchildid: 1
                },
                sysobjectchild2: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    sysobjectchildid: 1
                }
            };

            expect(validateObject(obj)).to.be.false;
        });

        it('allow additional properties in sys subschemas', function () {

            let obj = {
                sysobjectchild: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    sysobjectchildid: 1,
                    unknownproperty: 1
                }
            };

            expect(validateObject(obj)).to.be.true;
        });
    });

    describe('system schema containers', function () {

        it('valid container', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            sysobjectchild: {
                                dapobjectbaseid: 1,
                                objectbaseid: 1,
                                sysobjectbaseid: 1,
                                sysobjectchildid: 1
                            }
                        }
                    ]
                }
            };

            expect(validateObject(obj)).to.be.true;
        });

        it('missing list', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects2: null
                }
            };

            expect(validateObject(obj)).to.be.false;
        });

        it('null list', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: null
                }
            };

            expect(validateObject(obj)).to.be.false;
        });

        it('empty list', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: []
                }
            };

            expect(validateObject(obj)).to.be.false;
        });

        it('incorrect item type', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            sysobjectchild2: {
                                objectbaseid: 1,
                                sysobjectbaseid: 1,
                                sysobjectchildid: 1
                            }
                        }
                    ]
                }
            };

            expect(validateObject(obj)).to.be.false;
        });

        it('missing array item required field', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            sysobjectchild: {
                                objectbaseid: 1,
                                sysobjectbaseid: 1,
                                sysobjectchildid: null
                            }
                        }
                    ]
                }
            };

            expect(validateObject(obj)).to.be.false;
        });

        it('missing array item required base field', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            sysobjectchild: {
                                objectbaseid: null,
                                sysobjectbaseid: 1,
                                sysobjectchildid: 1
                            }
                        }
                    ]
                }
            };

            expect(validateObject(obj)).to.be.false;
        });

        it('prevent multiple subschema-type definitions', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            sysobjectchild: {
                                objectbaseid: 1,
                                sysobjectbaseid: 1,
                                sysobjectchildid: 1
                            }
                        },
                        {
                            sysobjectchild2: {
                                objectbaseid: 1
                            }
                        }
                    ]
                }
            };

            expect(validateObject(obj)).to.be.false;
        });

        it('prevent additional item types', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            sysobjectchild: {
                                objectbaseid: 1,
                                sysobjectbaseid: 1,
                                sysobjectchildid: 1
                            }
                        },
                        {
                            sysobjectchild2: {
                                objectbaseid: 1
                            }
                        }
                    ]
                }
            };

            expect(validateObject(obj)).to.be.false;
        });

        it('prevent duplicate items', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            sysobjectchild: {
                                objectbaseid: 1,
                                sysobjectbaseid: 1,
                                sysobjectchildid: 1
                            }
                        },
                        {
                            sysobjectchild: {
                                objectbaseid: 1,
                                sysobjectbaseid: 1,
                                sysobjectchildid: 1
                            }
                        }
                    ]
                }
            };

            expect(validateObject(obj)).to.be.false;
        });

    });

    describe('dapcontract schema', function () {

        it('valid dapcontract object', function () {

            let obj = {
                dapobjectchild: {
                    objectbaseid: 1,
                    dapobjectbaseid: 1,
                    dapobjectid: 1
                }
            };

            expect(validateObject(obj, DapSchema)).to.be.true;
        });

        it('missing required field', function () {

            let obj = {
                dapobjectchild: {
                    objectbaseid: 1,
                    dapobjectbaseid: 1,
                    dapobjectid: null
                }
            };

            expect(validateObject(obj, DapSchema)).to.be.false;
        });

        it('missing required field in super 1', function () {

            let obj = {
                dapobjectchild: {
                    objectbaseid: 1,
                    dapobjectbaseid: null,
                    dapobjectid: 1
                }
            };

            expect(validateObject(obj, DapSchema)).to.be.false;
        });

        it('missing required field in base', function () {

            let obj = {
                dapobjectchild: {
                    objectbaseid: null,
                    dapobjectbaseid: 1,
                    dapobjectid: 1
                }
            };

            expect(validateObject(obj, DapSchema)).to.be.false;
        });

        it('prevent additional properties in main dapcontract schema', function () {

            let obj = {
                dapobjectchild: {
                    objectbaseid: 1,
                    dapobjectbaseid: 1,
                    dapobjectid: 1
                },
                dapobject2: {
                    objectbaseid: 1
                }
            };

            expect(validateObject(obj, DapSchema)).to.be.false;
        });

        it('allow additional properties in dapcontract subschemas', function () {

            let obj = {
                dapobjectchild: {
                    objectbaseid: 1,
                    dapobjectbaseid: 1,
                    dapobjectid: 1,
                    unknownproperty: 1
                }
            };

            expect(validateObject(obj, DapSchema)).to.be.true;
        });
    });

    describe('dapcontract object container', function () {


        it('valid container', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            dapobjectchild: {
                                objectbaseid: 1,
                                dapobjectbaseid: 1,
                                dapobjectid: 1
                            }
                        }
                    ]
                }
            };

            // Note we need to validate the Container using the system schema and
            // also MUST validate the array contents using the dapcontract schema
            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            let validate2 = ajv.compile(DapSchema);
            let valid2 = validate2(obj.dapobjectcontainer.dapobjects[0]);
            expect(valid && valid2).to.be.true;
        });

        it('missing list', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                }
            };

            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            expect(valid).to.be.false;
        });

        it('empty list', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: []
                }
            };

            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            expect(valid).to.be.false;
        });

        it('incorrect item type', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            dapobjectchild2: {
                                objectbaseid: 1,
                                dapobjectbaseid: 1,
                                dapobjectid: 1
                            }
                        }
                    ]
                }
            };

            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            let validate2 = ajv.compile(DapSchema);
            let valid2 = validate2(obj.dapobjectcontainer.dapobjects[0]);
            expect(valid && valid2).to.be.false;
        });

        it('missing array item required field', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            dapobjectchild: {
                                objectbaseid: 1,
                                dapobjectbaseid: 1,
                                dapobjectid: null
                            }
                        }
                    ]
                }
            };

            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            let validate2 = ajv.compile(DapSchema);
            let valid2 = validate2(obj.dapobjectcontainer.dapobjects[0]);
            expect(valid && valid2).to.be.false;
        });

        it('missing array item required base field', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            dapobjectchild: {
                                objectbaseid: 1,
                                dapobjectbaseid: null,
                                dapobjectid: 1
                            }
                        }
                    ]
                }
            };

            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            let validate2 = ajv.compile(DapSchema);
            let valid2 = validate2(obj.dapobjectcontainer.dapobjects[0]);
            expect(valid && valid2).to.be.false;
        });

        it('prevent multiple subschema-type definitions', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            dapobjectchild: {
                                objectbaseid: 1,
                                dapobjectbaseid: 1,
                                dapobjectid: 1
                            }
                        },
                        {
                            dapobjectchild2: {
                                objectbaseid: 1,
                                dapobjectbaseid: 1,
                                dapobjectid: 1
                            }
                        }
                    ]
                }
            };

            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            let validate2 = ajv.compile(DapSchema);
            let valid2 = validate2(obj.dapobjectcontainer.dapobjects[0]);
            let valid3 = validate2(obj.dapobjectcontainer.dapobjects[1]);
            expect(valid && valid2 && valid3).to.be.false;
        });

        it('prevent additional item types', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            dapobjectchild: {
                                objectbaseid: 1,
                                dapobjectbaseid: 1,
                                dapobjectid: 1
                            },
                            dapobjectchild2: {
                                objectbaseid: 1,
                                dapobjectbaseid: 1,
                                dapobjectid: 1
                            }
                        }
                    ]
                }
            };

            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            let validate2 = ajv.compile(DapSchema);
            let valid2 = validate2(obj.dapobjectcontainer.dapobjects[0]);
            expect(valid && valid2).to.be.false;
        });

        it('prevent duplicate items', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            dapobjectchild: {
                                objectbaseid: 1,
                                dapobjectbaseid: 1,
                                dapobjectid: 1
                            }
                        },
                        {
                            dapobjectchild: {
                                objectbaseid: 1,
                                dapobjectbaseid: 1,
                                dapobjectid: 1
                            }
                        }
                    ]
                }
            };

            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            let validate2 = ajv.compile(DapSchema);
            let valid2 = validate2(obj.dapobjectcontainer.dapobjects[0]);
            let valid3 = validate2(obj.dapobjectcontainer.dapobjects[1]);
            expect(valid && valid2 && valid3).to.be.false;
        });
    });

    describe('dapcontract object containers', function () {


        it('valid container', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            dapobjectchild: {
                                objectbaseid: 1,
                                dapobjectbaseid: 1,
                                dapobjectid: 1
                            }
                        }
                    ]
                }
            };

            // Note we need to validate the Container using the system schema and
            // also MUST validate the array contents using the dapcontract schema
            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            let validate2 = ajv.compile(DapSchema);
            let valid2 = validate2(obj.dapobjectcontainer.dapobjects[0]);
            expect(valid && valid2).to.be.true;
        });

        it('missing list', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                }
            };

            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            expect(valid).to.be.false;
        });

        it('empty list', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: []
                }
            };

            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            expect(valid).to.be.false;
        });

        it('incorrect item type', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            dapobjectchild2: {
                                objectbaseid: 1,
                                dapobjectbaseid: 1,
                                dapobjectid: 1
                            }
                        }
                    ]
                }
            };

            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            let validate2 = ajv.compile(DapSchema);
            let valid2 = validate2(obj.dapobjectcontainer.dapobjects[0]);
            expect(valid && valid2).to.be.false;
        });

        it('missing array item required field', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            dapobjectchild: {
                                objectbaseid: 1,
                                dapobjectbaseid: 1,
                                dapobjectid: null
                            }
                        }
                    ]
                }
            };

            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            let validate2 = ajv.compile(DapSchema);
            let valid2 = validate2(obj.dapobjectcontainer.dapobjects[0]);
            expect(valid && valid2).to.be.false;
        });

        it('missing array item required base field', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            dapobjectchild: {
                                objectbaseid: 1,
                                dapobjectbaseid: null,
                                dapobjectid: 1
                            }
                        }
                    ]
                }
            };

            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            let validate2 = ajv.compile(DapSchema);
            let valid2 = validate2(obj.dapobjectcontainer.dapobjects[0]);
            expect(valid && valid2).to.be.false;
        });

        it('prevent multiple subschema-type definitions', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            dapobjectchild: {
                                objectbaseid: 1,
                                dapobjectbaseid: 1,
                                dapobjectid: 1
                            }
                        },
                        {
                            dapobjectchild2: {
                                objectbaseid: 1,
                                dapobjectbaseid: 1,
                                dapobjectid: 1
                            }
                        }
                    ]
                }
            };

            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            let validate2 = ajv.compile(DapSchema);
            let valid2 = validate2(obj.dapobjectcontainer.dapobjects[0]);
            let valid3 = validate2(obj.dapobjectcontainer.dapobjects[1]);
            expect(valid && valid2 && valid3).to.be.false;
        });

        it('prevent additional item types', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            dapobjectchild: {
                                objectbaseid: 1,
                                dapobjectbaseid: 1,
                                dapobjectid: 1
                            },
                            dapobjectchild2: {
                                objectbaseid: 1,
                                dapobjectbaseid: 1,
                                dapobjectid: 1
                            }
                        }
                    ]
                }
            };

            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            let validate2 = ajv.compile(DapSchema);
            let valid2 = validate2(obj.dapobjectcontainer.dapobjects[0]);
            expect(valid && valid2).to.be.false;
        });

        it('prevent duplicate items', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    dapobjects: [
                        {
                            dapobjectchild: {
                                objectbaseid: 1,
                                dapobjectbaseid: 1,
                                dapobjectid: 1
                            }
                        },
                        {
                            dapobjectchild: {
                                objectbaseid: 1,
                                dapobjectbaseid: 1,
                                dapobjectid: 1
                            }
                        }
                    ]
                }
            };

            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            let validate2 = ajv.compile(DapSchema);
            let valid2 = validate2(obj.dapobjectcontainer.dapobjects[0]);
            let valid3 = validate2(obj.dapobjectcontainer.dapobjects[1]);
            expect(valid && valid2 && valid3).to.be.false;
        });
    });

    describe('sysmod container', function () {


        it('valid container', function () {

            let obj = {
                dapobjectcontainer: {
                    objectbaseid: 1,
                    sysobjectbaseid: 1,
                    dapobjectcontainerid: 1,
                    sysmod:
                        {
                            sysmodid: 1
                        }
                }
            };

            // Note we need to validate the Container using the system schema and
            // also MUST validate the array contents using the dapcontract schema
            let validate = ajv.compile(SysSchema);
            let valid = validate(obj);

            expect(valid).to.be.true;
        });
    });
});
