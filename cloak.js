// MutationObserver to watch for changes in the DOM
if (!window.cloakObserver) {
    window.cloakObserver = new MutationObserver(cloakText);
}

function matchPatterns(value) {
    const guidPattern = /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const domainPattern = /(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/;
    const ipv4Pattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;

    if (guidPattern.test(value) || emailPattern.test(value) || domainPattern.test(value) || ipv4Pattern.test(value)) {
        return true;
    }
    return false;
}

function applyFilter(shouldCloak) {
    const filter = shouldCloak ? "blur(5px)" : "none";
    const maskText = "*****";
    const elements = document.querySelectorAll('body *');
    for (const element of elements) {
        // Handle title
        const title = element.getAttribute("title");
        const maskTitle = element.getAttribute("maskTitle");
        if (
            (shouldCloak && title && matchPatterns(title)) ||
            (!shouldCloak && maskTitle && matchPatterns(maskTitle))
        ) {
            element.style.filter = filter;
            if (shouldCloak) { 
                element.setAttribute("title", maskText);
                element.setAttribute("maskTitle", title);
            } else {
                element.setAttribute("title", maskTitle);
                element.removeAttribute("maskTitle");
            }
            continue;
        }
        // Handle children
        for (const child of element.childNodes) {
            if (
                (child.nodeType === Node.TEXT_NODE) &&
                matchPatterns(child.nodeValue)
            ) {
                element.style.filter = filter;
                break;
            }
        }
    }
}

function cloakText() {
    applyFilter(true);
}

function cloakTextAndStartObserving() {
    cloakText();

    // Start observing the whole document for changes
    window.cloakObserver && window.cloakObserver.observe(document.body, {
        childList: true, // Watch for added/removed elements
        subtree: true   // Watch the entire subtree of the document
    });
}

function unCloakTextAndStopObserving() {
    window.cloakObserver && window.cloakObserver.disconnect();
    window.cloakObserver = null;
    applyFilter(false);
}

window.unCloakTextAndStopObserving = unCloakTextAndStopObserving;
window.cloakTextAndStartObserving = cloakTextAndStartObserving;
