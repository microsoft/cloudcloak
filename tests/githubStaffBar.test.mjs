import test from 'node:test';
import assert from 'node:assert/strict';

import { isGitHubSettingsUrl, isGitHubUrl, shouldHideGitHubStaffBar } from '../common.js';

test('targets staff bar removal on github.com and github.com subdomains', () => {
    assert.equal(isGitHubUrl('https://github.com/microsoft/cloudcloak/pull/82'), true);
    assert.equal(isGitHubUrl('https://gist.github.com/microsoft'), true);
    assert.equal(isGitHubUrl('https://docs.github.com/en'), true);
    assert.equal(isGitHubUrl('https://raw.githubusercontent.com/microsoft/cloudcloak/main/README.md'), false);
    assert.equal(isGitHubUrl('http://github.com/microsoft/cloudcloak'), false);
    assert.equal(isGitHubUrl('https://notgithub.com/microsoft'), false);
    assert.equal(isGitHubUrl(''), false);
    assert.equal(isGitHubSettingsUrl('https://github.com/settings/profile'), true);
    assert.equal(isGitHubSettingsUrl('https://github.com/orgs/microsoft/settings/profile'), true);
    assert.equal(isGitHubSettingsUrl('https://github.com/microsoft/cloudcloak/settings/secrets/actions'), true);
    assert.equal(isGitHubSettingsUrl('https://github.com/microsoft/cloudcloak/blob/main/README.md'), false);
    assert.equal(isGitHubSettingsUrl('https://docs.github.com/en'), false);
    assert.equal(isGitHubSettingsUrl('https://gist.github.com/microsoft'), false);

    assert.equal(shouldHideGitHubStaffBar('https://github.com/microsoft/cloudcloak/pull/82'), true);
    assert.equal(shouldHideGitHubStaffBar('https://github.com/'), true);
    assert.equal(shouldHideGitHubStaffBar('https://gist.github.com/microsoft'), true);
    assert.equal(shouldHideGitHubStaffBar('https://docs.github.com/en'), true);
    assert.equal(shouldHideGitHubStaffBar('http://github.com/microsoft/cloudcloak'), false);
    assert.equal(shouldHideGitHubStaffBar('https://notgithub.com/microsoft'), false);
});
