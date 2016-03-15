[![Build Status](https://travis-ci.org/aullman/opentok-editor.svg?branch=master)](https://travis-ci.org/aullman/opentok-editor)
[![Code Climate](https://codeclimate.com/github/aullman/opentok-editor/badges/gpa.svg)](https://codeclimate.com/github/aullman/opentok-editor)
[![Test Coverage](https://codeclimate.com/github/aullman/opentok-editor/badges/coverage.svg)](https://codeclimate.com/github/aullman/opentok-editor)

# opentok-editor

A real time collaborative editor for OpenTok using CodeMirror and ot.js

## Installation

You can either use [Bower](http://bower.io/):

`bower install opentok-editor`

or clone this repo and include the `opentok-editor.js` or `opentok-editor.min.js` file.

## Usage

See [index.html](index.html). You will need to replace the values for API_KEY, SESSION_ID and TOKEN with values using your [OpenTok](https://www.tokbox.com/opentok) account. Then you can run `npm start` and go to localhost:8080 in your browser.

## How to Build Yourself

Keep all custom changes to the `src/` files and then run:

```
npm install
```

Which will install all bower components and run the gulp build to build the `opentok-editor.js` and `opentok-editor.min.js` files.
