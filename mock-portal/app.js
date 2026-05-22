function toggleText(button, selector, hiddenValue, shownValue) {
    const target = document.querySelector(selector);
    if (!target) {
        return;
    }

    const isHidden = button.dataset.state !== 'shown';
    target.textContent = isHidden ? shownValue : hiddenValue;
    button.dataset.state = isHidden ? 'shown' : 'hidden';
    button.textContent = isHidden ? 'Hide' : 'Show';
}

function setupTooltipScenario() {
    const button = document.querySelector('#tooltip-toggle');
    const target = document.querySelector('#dynamic-tooltip-value');
    if (!button || !target) {
        return;
    }

    button.addEventListener('click', () => {
        target.classList.toggle('expanded');
        target.setAttribute('title', target.getAttribute('title') ? '' : 'cdn-origin-westus2.contoso.internal');
    });
}

function setupDropdownScenario() {
    const button = document.querySelector('#dropdown-button');
    const menu = document.querySelector('#dropdown-menu');
    if (!button || !menu) {
        return;
    }

    button.addEventListener('mousedown', () => {
        menu.hidden = false;
        menu.setAttribute('aria-hidden', 'false');
        button.setAttribute('aria-expanded', 'true');
    });

    button.addEventListener('click', () => {
        const shouldHide = !menu.hidden;
        menu.hidden = shouldHide;
        menu.setAttribute('aria-hidden', shouldHide ? 'true' : 'false');
        button.setAttribute('aria-expanded', shouldHide ? 'false' : 'true');
    });
}

function setupStorageScenario() {
    const keyButton = document.querySelector('#show-key1');
    const sasButton = document.querySelector('#generate-sas');
    if (keyButton) {
        keyButton.addEventListener('click', () => {
            toggleText(
                keyButton,
                '#key1-value',
                '************************************',
                'AbCdEfGhIjKlMnOpQrStUvWxYz1234567890KeyValue'
            );
        });
    }

    if (sasButton) {
        sasButton.addEventListener('click', () => {
            const target = document.querySelector('#sas-output');
            if (!target) {
                return;
            }

            target.textContent = 'sv=2024-08-04&ss=b&srt=sco&sp=rwdlacupiytfx&se=2030-07-01T12:00:00Z&sig=FakeSignatureValue1234567890';
            target.className = 'output generated';
        });
    }
}

setupTooltipScenario();
setupDropdownScenario();
setupStorageScenario();
