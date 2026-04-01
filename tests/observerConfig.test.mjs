import test from 'node:test';
import assert from 'node:assert/strict';

import { cloakObserverOptions } from '../common.js';

test('observes title attribute mutations for tooltip masking', () => {
    assert.equal(cloakObserverOptions.attributes, true);
    assert.deepEqual(cloakObserverOptions.attributeFilter, ['title']);
    assert.equal(cloakObserverOptions.childList, true);
    assert.equal(cloakObserverOptions.subtree, true);
    assert.equal(cloakObserverOptions.characterData, true);
});
