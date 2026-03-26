export const supportedDomains = [
    'https://portal.azure.com',
    'https://ms.portal.azure.com',
    'https://rc.portal.azure.com',
    'https://preview.portal.azure.com',
    'https://entra.microsoft.com',
    'https://intune.microsoft.com',
    'https://ai.azure.com',
    'https://admin.microsoft.com',
    'https://sip.security.microsoft.com',
    'https://purview.microsoft.com',
    'https://make.powerapps.com',
    'https://make.preview.powerapps.com',
    'https://msazure.visualstudio.com',
    'https://github.com',
    'https://copilotstudio.microsoft.com',
    'https://copilotstudio.preview.microsoft.com',
    'https://reactblade-ms.portal.azure.net',
    'https://reactblade.portal.azure.net',
    'https://reactblade-ms*.portal.azure.net',
    'https://reactblade*.portal.azure.net',
    'https://*.reactblade-ms.portal.azure.net',
    'https://*.reactblade.portal.azure.net'
];

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const supportedDomainMatchers = supportedDomains.map((supportedDomain) => {
    const supportedUrl = new URL(supportedDomain.replaceAll('*', 'wildcard'));
    if (!supportedDomain.includes('*')) {
        return {
            protocol: supportedUrl.protocol,
            origin: supportedUrl.origin
        };
    }

    return {
        protocol: supportedUrl.protocol,
        hostnameRegex: new RegExp(`^${supportedUrl.hostname
            .split('wildcard')
            .map(escapeRegex)
            .join('[^.]+')}$`)
    };
});

export function isSupportedUrl(url) {
    if (!url) {
        return false;
    }

    const currentUrl = new URL(url);

    return supportedDomainMatchers.some((supportedDomainMatcher) => {
        if (supportedDomainMatcher.origin) {
            return currentUrl.origin === supportedDomainMatcher.origin;
        }

        return currentUrl.protocol === supportedDomainMatcher.protocol &&
            supportedDomainMatcher.hostnameRegex.test(currentUrl.hostname);
    });
}

export function normalizePageRuleText(value) {
    return (value || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

export function matchesPageRuleLabel(label, contextValue) {
    const normalizedLabel = normalizePageRuleText(label);
    const normalizedContextValue = normalizePageRuleText(contextValue);
    if (!normalizedLabel || !normalizedContextValue) {
        return false;
    }

    const labelPattern = normalizedLabel
        .split(" ")
        .map(escapeRegex)
        .join("\\s+");

    return new RegExp(`(^|[^a-z0-9])${labelPattern}($|[^a-z0-9])`, "i").test(normalizedContextValue);
}

export const pageSpecificRules = [
    {
        id: "azure-storage-access-keys",
        toggleId: "secrets",
        urlRegexes: [
            /storageaccounts/i,
            /(access[-\s]?keys|(?:\/|=)keys(?:[/?#]|$)|sharedaccesssignature|shared access signature|\bsas\b)/i
        ],
        contextLabels: [
            "key",
            "key1",
            "key2",
            "key 1",
            "key 2",
            "connection string",
            "shared access signature",
            "sas",
            "signature",
            "secret"
        ],
        valueSelectors: [
            "input",
            "textarea",
            "[role='textbox']",
            "[class*='value']"
        ],
        nearbyActionLabels: [
            "show",
            "hide",
            "copy"
        ],
        minimumValueLength: 16,
        interactionRescanDelays: [0, 75, 250]
    }
];

export function matchesPageRuleUrl(rule, url) {
    if (!rule || !url) {
        return false;
    }

    return (rule.urlRegexes || []).every((regex) => regex.test(url));
}

export function isPageRuleActive(rule, url, toggleStates = {}) {
    if (!rule || !rule.toggleId || !toggleStates[rule.toggleId]) {
        return false;
    }

    return matchesPageRuleUrl(rule, url);
}

const ipAddressRegexes = [
    /(?<![0-9A-Za-z.])(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}(?![0-9A-Za-z]|\.\d)/, // IPv4
    /(?<![0-9A-Za-z:])(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}(?![0-9A-Za-z:]|\.\d)/, // IPv6 expanded
    /(?<![0-9A-Za-z:])(?:[0-9A-Fa-f]{1,4}:){1,7}:(?![0-9A-Za-z:]|\.\d)/, // IPv6 shorthand trailing ::
    /(?<![0-9A-Za-z:])(?:[0-9A-Fa-f]{1,4}:){1,6}:[0-9A-Fa-f]{1,4}(?![0-9A-Za-z:]|\.\d)/, // IPv6 shorthand single omitted group
    /(?<![0-9A-Za-z:])(?:[0-9A-Fa-f]{1,4}:){1,5}(?::[0-9A-Fa-f]{1,4}){1,2}(?![0-9A-Za-z:]|\.\d)/, // IPv6 shorthand double omitted group
    /(?<![0-9A-Za-z:])(?:[0-9A-Fa-f]{1,4}:){1,4}(?::[0-9A-Fa-f]{1,4}){1,3}(?![0-9A-Za-z:]|\.\d)/, // IPv6 shorthand triple omitted group
    /(?<![0-9A-Za-z:])(?:[0-9A-Fa-f]{1,4}:){1,3}(?::[0-9A-Fa-f]{1,4}){1,4}(?![0-9A-Za-z:]|\.\d)/, // IPv6 shorthand four omitted groups
    /(?<![0-9A-Za-z:])(?:[0-9A-Fa-f]{1,4}:){1,2}(?::[0-9A-Fa-f]{1,4}){1,5}(?![0-9A-Za-z:]|\.\d)/, // IPv6 shorthand five omitted groups
    /(?<![0-9A-Za-z:])[0-9A-Fa-f]{1,4}:(?:(?::[0-9A-Fa-f]{1,4}){1,6})(?![0-9A-Za-z:]|\.\d)/, // IPv6 shorthand six omitted groups
    /(?<![0-9A-Za-z:]):(?:(?::[0-9A-Fa-f]{1,4}){1,7}|:)(?![0-9A-Za-z:]|\.\d)/, // IPv6 shorthand leading ::
    /(?<![0-9A-Za-z:])(?:[0-9A-Fa-f]{1,4}:){6}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}(?![0-9A-Za-z:]|\.\d)/, // IPv6 dotted quad expanded
    /(?<![0-9A-Za-z:])(?:(?:[0-9A-Fa-f]{1,4}:){1,5}:|::(?:[0-9A-Fa-f]{1,4}:){0,4})(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}(?![0-9A-Za-z:]|\.\d)/ // IPv6 dotted quad shorthand
];

export const cloakablePatterns = [
    {
        id: 'secrets',
        label: 'Secrets',
        regexes: [
            /(^|[^abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890+/-_=])(?<refine>[abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890]{42}AzSe[A-D][abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890]{5})([^abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890+/-_=]|$)/ // Azure search
        ]
    },
    {
        id: 'guids',
        label: 'GUIDs',
        regexes: [
            /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/
        ]
    },
    {
        id: 'domains',
        label: 'Domains',
        regexes: [
            /(?!.*[\\/])(?:[a-zA-Z0-9-]+\.)+(com|org|net|edu|gov|mil|int|co|io|biz|info|me|us|uk|ca|de|jp|fr|au|in|cn|ru|br|za|nl|se|no|es|it|ch|pl|eu|tv|cc|ws|mobi|asia|name|pro|aero|coop|museum)/
        ]
    },
    {
        id: 'ipaddresses',
        label: 'IP Addresses',
        regexes: ipAddressRegexes
    },
    {
        id: 'email',
        label: 'Emails',
        regexes: [
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        ]
    },
    {
        id: 'phone',
        label: 'Phone Numbers',
        regexes: [
            /\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/, //us phone
            /(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}/, //uk phone
            /(\+91[\-\s]?)??(91)?\d{9}/, //india phone
        ]
    },
    {
        id: 'urls',
        label: 'URLs',
        regexes: [
            /https?:\/\/[^\s]*/
        ]
    },
    {
        id: 'subscriptioninfo',
        label: 'Subscription Info',
        category: 'Subscription Info',
        regexes: []
    }
];
