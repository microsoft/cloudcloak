function matchPatterns(value)
{
    const guidPattern = /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const domainPattern = /(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/;
    const ipv4Pattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;

    if (guidPattern.test(value) || emailPattern.test(value) || domainPattern.test(value) || ipv4Pattern.test(value)) {
        return true;
    }
    return false;
}

function unCloakText() {
    const elements = document.querySelectorAll('body *');
    elements.forEach(element => {
        element.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                if (matchPatterns(child.nodeValue)) {
                        element.style.filter = "none";
                }
            }
        });
        title = element.getAttribute('title');
        if (title && matchPatterns(title)) {
                element.style.filter = "none";
        }
    });
}
unCloakText();
