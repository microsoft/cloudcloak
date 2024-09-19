# Azure "Cloak Mode" Browser Extension

This is a browser extension for folks who might be streaming or presenting while simultaneously showing the Azure Portal. It does its very best to hide connection strings, email addresses, avatars, and anything that might show secure or personal information. It's not perfect, but it's 95% solid. The goal is to avoid any kind of information leakage when presenting or streaming while live coding and using the Azure Portal.

## Installing the Extension

1. [Download and unzip the latest version of the extension](https://github.com/microsoft/azurecloak/archive/refs/heads/main.zip) (or clone this repository)
2. Open the Edge or Chrome browser
3. Navigate to the browser's `Extensions` page
   - Click `...`, then `Extensions`, then `Manage extensions`
4. Enable `Developer mode`
5. Select `Load unpacked` and navigate to the directory containing the extension code
6. Pin the extension icon to the toolbar
   - Click the extension "puzzle piece" in the browser toolbar, then `...` for the extension, then `Show in toolbar`

## Using the Extension

1. Navigate to the [Azure Portal](https://portal.azure.com/)
2. Click the extension icon in the toolbar to toggle it from `OFF` to `ON`
3. Confirm that sensitive data like IP addresses, GUIDs, and email addresses are blurred-out

## Reporting Issues

1. [Open the project's `Issues` page](https://github.com/microsoft/azurecloak/issues)
2. Look for an existing issue that describes your scenario
3. OR create a new issue
   - Please provide detailed steps to reproduce the issue
