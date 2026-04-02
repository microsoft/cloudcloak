import test from 'node:test';
import assert from 'node:assert/strict';

import { cloakObserverOptions } from '../common.js';

test('observes title and visibility-related attribute mutations for dynamic masking', () => {
    assert.equal(cloakObserverOptions.attributes, true);
    assert.deepEqual(
        cloakObserverOptions.attributeFilter,
        ['title', 'class', 'style', 'hidden', 'aria-expanded', 'aria-hidden', 'data-cloudcloak']
    );
    assert.equal(cloakObserverOptions.childList, true);
    assert.equal(cloakObserverOptions.subtree, true);
    assert.equal(cloakObserverOptions.characterData, true);
});
