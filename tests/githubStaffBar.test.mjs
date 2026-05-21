import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldHideGitHubStaffBar } from '../common.js';

test('targets staff bar removal on github.com and github.com subdomains', () => {
    assert.equal(shouldHideGitHubStaffBar('https://github.com/microsoft/cloudcloak/pull/82'), true);
    assert.equal(shouldHideGitHubStaffBar('https://github.com/'), true);
    assert.equal(shouldHideGitHubStaffBar('https://gist.github.com/microsoft'), true);
    assert.equal(shouldHideGitHubStaffBar('https://docs.github.com/en'), true);
    assert.equal(shouldHideGitHubStaffBar('http://github.com/microsoft/cloudcloak'), false);
    assert.equal(shouldHideGitHubStaffBar('https://notgithub.com/microsoft'), false);
});
