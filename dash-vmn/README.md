[![NPM](https://nodei.co/npm/dash-schema.png?downloads=true)](https://nodei.co/npm/dash-vmn/)

[![Dependency Status](https://david-dm.org/dash-vmn/dash-vmn.svg)](https://david-dm.org/dash-vmn/dash-vmn) [![devDependency Status](https://david-dm.org/docstrap/docstrap/dev-status.svg)](https://david-dm.org/docstrap/docstrap#info=devDependencies)

[![Build Status](https://travis-ci.com/dashevo/dash-vmn.svg?token=Pzix7aqnMuGS9c6BmBz2&branch=master)](https://travis-ci.com/dashevo/dash-vmn)

# Dash Virtual Masternode

A standalone Masternode emulator for Layer 2 (Evolution) functions in JavaScript

Provides a stack of interconnected modules emulating L2 functions:

  - DashPayLib
  - DAP SDK
  - DAPI
  - DashDrive
  - DashCore

## Build

NOTE: for now build VMN within dash-schema until it's moved to a new dash-vmn repo..

Ensure you have the latest [NodeJS](https://nodejs.org/en/download/) installed.

Clone the repo:

```
git clone https://github.com/dashevo/dash-vmn 
```

Install npm packages:
```
cd dash-vmn && npm install
```

Build: (lint, gen test data, run all tests)
```
npm run build
```

Build HTML docs:

```
# builds to... ./docs/html/index.html
npm run docs 
```

## Test
Run all tests:
```
npm test
```

Follow the Stack log:
```
tail -F ./__tests__/data/stack.log
```

Follow the Stack DB contents:
```
tail -F ./__tests__/data/stack-db.json
```

Regenerate test data:
```
# outputs to... ./__tests__/data/dashpay-test-data.json
npm test:gen
```













