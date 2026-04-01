import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
    supportedDomains,
    supportedHostPermissionPatterns
} from '../common.js';

const manifest = JSON.parse(
    await readFile(new URL('../manifest.json', import.meta.url), 'utf8')
);

function matchesHostPermission(url, pattern) {
    const candidateUrl = new URL(url);
    const [scheme, hostAndPath] = pattern.split('://');
    const matchHostname = hostAndPath.slice(0, -2);

    if (candidateUrl.protocol !== `${scheme}:`) {
        return false;
    }

    const candidateHostname = candidateUrl.hostname;
    if (!matchHostname.startsWith('*.')) {
        return candidateHostname === matchHostname;
    }

    const hostnameSuffix = matchHostname.slice(2);
    return candidateHostname.endsWith(`.${hostnameSuffix}`);
}

function getRepresentativeSupportedUrl(supportedDomain) {
    return supportedDomain
        .replace('reactblade-ms*', 'reactblade-ms123')
        .replace('reactblade*', 'reactblade123')
        .replace('https://*.reactblade-ms.portal.azure.net', 'https://child.reactblade-ms.portal.azure.net')
        .replace('https://*.reactblade.portal.azure.net', 'https://child.reactblade.portal.azure.net');
}

test('manifest host permissions stay aligned with supported host permission patterns', () => {
    assert.deepEqual(manifest.host_permissions, supportedHostPermissionPatterns);
    assert.deepEqual(manifest.web_accessible_resources[0]?.matches, supportedHostPermissionPatterns);
});

test('supported host permission patterns cover supported domains', () => {
    const uncoveredSupportedUrls = supportedDomains
        .map(getRepresentativeSupportedUrl)
        .filter((supportedUrl) => !supportedHostPermissionPatterns.some((pattern) => matchesHostPermission(supportedUrl, pattern)));

    assert.deepEqual(uncoveredSupportedUrls, []);
});
