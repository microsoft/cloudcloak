import test from 'node:test';
import assert from 'node:assert/strict';

import {
    isPageRuleActive,
    matchesPageRuleLabel,
    matchesPageRuleUrl,
    normalizePageRuleText,
    pageSpecificRules
} from '../common.js';

const azureStorageAccessKeyRule = pageSpecificRules.find((rule) => rule.id === 'azure-storage-access-keys');
const azureAiStudioKeysRule = pageSpecificRules.find((rule) => rule.id === 'azure-ai-studio-keys');

test('normalizes page rule text for label matching', () => {
    assert.equal(normalizePageRuleText('  Shared   Access   Signature  '), 'shared access signature');
    assert.equal(normalizePageRuleText('Key1'), 'key1');
    assert.equal(normalizePageRuleText(''), '');
});

test('matches page rule labels on word boundaries instead of substrings', () => {
    assert.equal(matchesPageRuleLabel('key', 'Storage account key'), true);
    assert.equal(matchesPageRuleLabel('connection string', 'Primary connection string'), true);
    assert.equal(matchesPageRuleLabel('client secret', 'Client Secret value'), true);
    assert.equal(matchesPageRuleLabel('token', 'Access token'), true);
    assert.equal(matchesPageRuleLabel('key', 'Search keywords'), false);
    assert.equal(matchesPageRuleLabel('key', 'Keyboard shortcut'), false);
    assert.equal(matchesPageRuleLabel('key 1', 'Key 1'), true);
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

test('Azure Storage access key rule targets reveal-flow containers and output-like elements', () => {
    assert.equal(azureStorageAccessKeyRule.maskClosestSelector.includes("[role='row']"), true);
    assert.equal(azureStorageAccessKeyRule.valueSelectors.includes("[class*='output']"), true);
    assert.equal(azureStorageAccessKeyRule.valueSelectors.includes("code"), true);
    assert.equal(azureStorageAccessKeyRule.valueSelectors.includes("pre"), true);
});

test('matches Azure AI Studio key routes', () => {
    assert.equal(
        matchesPageRuleUrl(
            azureAiStudioKeysRule,
            'https://ai.azure.com/resource?tid=72f988bf-86f1-41af-91ab-2d7cd011db47'
        ),
        true
    );

    assert.equal(
        matchesPageRuleUrl(
            azureAiStudioKeysRule,
            'https://ai.azure.com/resource/subscriptions/test/resourceGroups/demo'
        ),
        true
    );
});

test('Azure AI Studio rule covers metadata fields and output-like containers', () => {
    assert.equal(azureAiStudioKeysRule.contextLabels.includes('created by'), true);
    assert.equal(azureAiStudioKeysRule.contextLabels.includes('modified by'), true);
    assert.equal(azureAiStudioKeysRule.contextLabels.includes('endpoint uri'), true);
    const hasOutputClassSelector = azureAiStudioKeysRule.valueSelectors.some((selector) =>
        /\[class\*=['"]output['"]\]/.test(selector)
    );
    assert.equal(hasOutputClassSelector, true);
    assert.equal(azureAiStudioKeysRule.valueSelectors.includes('a[href]'), true);
    assert.equal(azureAiStudioKeysRule.maskClosestSelector.includes("[role='row']"), true);
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

    assert.equal(
        isPageRuleActive(azureAiStudioKeysRule, 'https://ai.azure.com/resource?tid=test', { secrets: true }),
        true
    );
});
