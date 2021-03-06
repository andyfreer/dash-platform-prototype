/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */
'use strict';
/**
 * @fileOverview Wrapper for JSON Schema validation
 * @private
 */
let Schema = require('../index.js');
let Ajv = require('ajv');

function validateSchemaObject(clonedObj, dapSchema) {

    let ajv = new Ajv({
        allErrors: false,
        verbose: true
    });
    let validate = null;
    if (dapSchema) {
        let dapSubSchema = Schema.def.getDapSubSchema(clonedObj, dapSchema);
        ajv.addSchema(Schema.System);
        validate = ajv.compile(dapSubSchema);
    } else {
        validate = ajv.compile(Schema.System);
    }

    validate(clonedObj);

    let objType = '';
    let schema = {};
    if (dapSchema) {
        objType = clonedObj.objtype;
        schema = dapSchema;
    } else {
        objType = Object.keys(clonedObj)[0];
        schema = Schema.System;
    }

    let res = _getAjvValidationResult(validate.errors, objType, schema);

    // TODO: return ValidationResult

    //return Schema.result(err);
    return res;
}

/**
 * Convert Ajv errors to Dash Schema errors
 * @param inpErrors {array} Array of Ajv errors
 * @param schemaName {string} Name of the Schema definition being validated
 * @returns {*}
 */
function _getAjvValidationResult(inpErrors, objType, schema) {

    if (inpErrors === null) {
        return Schema.result();
    }
    /*
    let outErrors = [];
    for (let i = 0; i < inpErrors.length; i++) {

        outErrors.push(new Schema.rules.New(
            inpErrors[i].message,
            errType,
            JSON.stringify(inpErrors[i].params),
            inpErrors[i].dataPath,
            inpErrors[i].schemaPath,
            schemaName
        ));
    }
    */

    let code = -1;
    let propName = '';
    let ajvError = inpErrors[0];

    switch (ajvError.keyword) {

        case 'required':

            code = Schema.rules.types.missing_property;
            propName = ajvError.params.missingProperty;
            break;

        case 'oneOf':

            break;

        case 'type':
            code = Schema.rules.types.invalid_type;
            propName = ajvError.dataPath;
            break;

        case 'additionalProperties':

            break;
    }

    return Schema.result(code, objType, propName, schema);
}

/*
function _create(errCode, prop, schema) {

    if (errCode === undefined || errCode === null) {
        throw new Error('create error: error code is undefined');
    }

    const err = {
        date: Date.now(),
        code: errCode
    };

    err.message = Schema.rules.codes[errCode];

    if (!err.message) {
        throw new Error('create error: error code is invalid');
    }

    if (prop) {
        err.property = prop;
    }

    if (schema) {
        err.schemaTitle = schema.title;
        err.schemaId = schema.$id;
        err.schemaDef = schema;
    }

    return err;
}
*/


function extractSchemaObject(objCopy, dapSchema) {

    // strip non-schema properties using AJV validator
    let ajv = new Ajv({
        allErrors: true,
        removeAdditional: true
    });
    let validate = null;
    if (dapSchema) {
        ajv.addSchema(Schema.System);
        validate = ajv.compile(dapSchema);
    } else {
        validate = ajv.compile(Schema.System);
    }

    // if invalid, just add the errors
    if (!validate(objCopy)) {
        objCopy.errors = validate.errors;
    }

    return objCopy;
}

function validateDapSchemaDef(dapSchema) {

    if (!dapSchema) {
        throw new Error('dapSchema was null');
    }

    try {
        let ajv = new Ajv();
        ajv.addSchema(dapSchema).compile(Schema.System);
    } catch (e) {

        return Schema.result(e.toString());
    }

    return undefined;
}

function validateSysSchemaDef(sysSchema) {

    if (!sysSchema) {
        throw new Error('sysSchema was null');
    }

    try {
        let ajv = new Ajv();
        ajv.compile(sysSchema);
    } catch (e) {

        return Schema.result(e.toString());
    }

    return undefined;
}


module.exports = {
    validate: validateSchemaObject,
    extractSchemaObject: extractSchemaObject,
    validateDapSchemaDef: validateDapSchemaDef,
    validateSysSchemaDef: validateSysSchemaDef
};
