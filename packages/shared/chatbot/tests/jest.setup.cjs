/**
 * External dependencies.
 */
const React = require('react');
const { TextEncoder, TextDecoder } = require('node:util');
const fetch = require('node-fetch');

global.React = React;
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;
global.fetch = fetch;
global.Request = fetch.Request;
global.Response = fetch.Response;
