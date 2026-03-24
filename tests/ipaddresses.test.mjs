import test from 'node:test';
import assert from 'node:assert/strict';

import { cloakablePatterns } from '../common.js';

const ipPatterns = cloakablePatterns.find((pattern) => pattern.id === 'ipaddresses').regexes;

function matches(value) {
    return ipPatterns.some((regex) => regex.test(value));
}

test('matches IPv4 and IPv6 addresses', () => {
    [
        '10.0.0.1',
        '255.255.255.255',
        '10.0.0.1:443',
        '10.0.0.1,',
        '10.0.0.1.',
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        '2001:db8::1',
        '::',
        '::1',
        'abc::',
        'FFFF::1',
        'fe80::1234:5678:9abc:def0',
        '::ffff:192.0.2.128',
        '[2001:db8::1]:443',
        '2001:db8::1,',
        '2001:db8::1.'
    ].forEach((value) => {
        assert.equal(matches(value), true, `expected ${value} to match`);
    });
});

test('does not match malformed IP addresses', () => {
    [
        'not-an-ip',
        '256.0.0.1',
        ':::',
        '2001:db8:::1',
        '12345::1',
        '2001:db8::g',
        '::ffff:999.0.2.128',
        'foo2001:db8::1bar'
    ].forEach((value) => {
        assert.equal(matches(value), false, `expected ${value} not to match`);
    });
});
