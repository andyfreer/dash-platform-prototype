[![NPM](https://nodei.co/npm/dash-schema.png?downloads=true)](https://nodei.co/npm/dash-schema/)

[![Dependency Status](https://david-dm.org/dash-schema/dash-schema.svg)](https://david-dm.org/dash-schema/dash-schema) [![devDependency Status](https://david-dm.org/docstrap/docstrap/dev-status.svg)](https://david-dm.org/docstrap/docstrap#info=devDependencies)

[![Build Status](https://travis-ci.com/dashevo/dash-schema.svg?token=Pzix7aqnMuGS9c6BmBz2&branch=master)](https://travis-ci.com/dashevo/dash-schema)

# Dash Schema

A consensus-code library for validating [Dash Schema](#) instances against System and DAP Schema definitions within the Dash protocol.

## Getting Started

Ensure you have the latest [NodeJS](https://nodejs.org/en/download/) installed.

Clone the repo:

```
git clone https://github.com/dashevo/dash-schema && cd dash-schema
```

Install npm packages:
```
npm install
```

Run tests:
```
npm test
```

Build docs, browser bundle and run all tests:
```
npm run build
```

## Usage

Install the library as a Node module.

```
$ npm install --save @dashevo/dash-schema
```

Reference the library within a Node module.

```js
let Schema = require('dash-schema');

// validate the System schema
let valid = Schema.validate.sysschema(Schema.System);
console.log(valid.valid));
// -> true
```

Include the browserified library in your HTML.

```html
<html>
<head>
  <script src='./dist/dash-schema.js'></script>
  <script>
    let Schema = require('dash-schema');

    // validate the System schema
    let valid = Schema.validate.sysschema(Schema.System);
    console.log(valid.valid));
    // -> true

  </script>
</head>
<body></body>
</html>
```


## Validation Results

Dash Schema validation has a standardized format for reporting the results of Schema instance validation and any errors occurring within that validation.

### Exception stratgy

 - Exceptions are thrown when usage of the library is incorrect, such as missing or null expected parameters
 - Exceptions are not thrown when library usage is correct but schema instance data is invalid according to schema definitions.  In this case a validation result is returned containing the validation error in question

### ValidationResult object

```
{
    valid: { boolean }
    errCode: { number } Error code
    errMsg: { string } Error message
    objData: { object } The object being validated
    objType: { string } Name of the object subschema
    rootSchema: { object } Definition of the root Schema used to validate this object
}
```

 - **valid** is a boolean value that is true when validation succeeded and false when validation failed
 - **error** an object {} when validation succeeded or a ValidationError object when validation failed

 > The error object **always exists**, either as an empty object {} or a ValidationObject.  Therefore it is **not sufficient** to check for the existance of the ```error``` object in a ValidationResult.
 > Instead, positive confirmation must be obtained by checking that the ```.valid``` property === true, to avoid situations where a bug returned null from some validation code.
