/**
 * External dependencies.
 */
const React = require('react');
const { TextEncoder, TextDecoder } = require('node:util');
const fetch = require('node-fetch');

global.React = React;
// @ts-ignore
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;
// @ts-ignore
global.fetch = fetch;
// @ts-ignore
global.Request = fetch.Request;
// @ts-ignore
global.Response = fetch.Response;
