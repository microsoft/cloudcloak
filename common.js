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
    'https://*.reactblade-ms.portal.azure.net',
    'https://*.reactblade.portal.azure.net'
  ];

  export const cloakablePatterns = [
    { 
        id: 'secrets', 
        label: 'Secrets',
        regexes: [       
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
        regexes: [
            /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/ //ipv4
        ]
    },
    {   id: 'email',
        label: 'Emails',
        regexes: [
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        ]
    },
    {   id: 'phone',
        label: 'Phone Numbers',
        regexes: [
            /\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/, //us phone
            /(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}/, //uk phone
            /(\+91[\-\s]?)??(91)?\d{9}/, //india phone
        ]
    },
    {   id: 'urls', 
        label: 'URLs',
        regexes: [
            /https?:\/\/[^\s]*/
        ]
    }
];