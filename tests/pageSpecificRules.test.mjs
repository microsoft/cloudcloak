import test from 'node:test';
import assert from 'node:assert/strict';

import {
    isPageRuleActive,
    matchesPageRuleUrl,
    normalizePageRuleText,
    pageSpecificRules
} from '../common.js';

const azureStorageAccessKeyRule = pageSpecificRules.find((rule) => rule.id === 'azure-storage-access-keys');

test('normalizes page rule text for label matching', () => {
    assert.equal(normalizePageRuleText('  Shared   Access   Signature  '), 'shared access signature');
    assert.equal(normalizePageRuleText('Key1'), 'key1');
    assert.equal(normalizePageRuleText(''), '');
});

test('matches Azure Storage access key routes', () => {
    assert.equal(
        matchesPageRuleUrl(
            azureStorageAccessKeyRule,
            'https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Storage%2FstorageAccounts~2FstorageAccounts/menuId/keys'
        ),
        true
    );

    assert.equal(
        matchesPageRuleUrl(
            azureStorageAccessKeyRule,
            'https://portal.azure.com/#resource/subscriptions/test/resourceGroups/demo/providers/Microsoft.Storage/storageAccounts/demo/sharedaccesssignature'
        ),
        true
    );
});

test('does not match unrelated Azure Storage routes', () => {
    assert.equal(
        matchesPageRuleUrl(
            azureStorageAccessKeyRule,
            'https://portal.azure.com/#resource/subscriptions/test/resourceGroups/demo/providers/Microsoft.Storage/storageAccounts/demo/overview'
        ),
        false
    );

    assert.equal(
        matchesPageRuleUrl(
            azureStorageAccessKeyRule,
            'https://portal.azure.com/#view/Microsoft_Azure_AI/OpenAI'
        ),
        false
    );
});

test('activates page rules only when the linked toggle is enabled', () => {
    const targetUrl = 'https://portal.azure.com/#resource/subscriptions/test/resourceGroups/demo/providers/Microsoft.Storage/storageAccounts/demo/keys';

    assert.equal(
        isPageRuleActive(azureStorageAccessKeyRule, targetUrl, { secrets: true }),
        true
    );

    assert.equal(
        isPageRuleActive(azureStorageAccessKeyRule, targetUrl, { secrets: false }),
        false
    );
});
