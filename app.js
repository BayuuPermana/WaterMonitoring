import { showModal, loadingIndicator } from './js/uiElements.js';
import { i18n } from './js/i18n.js';

i18n.init();

async function initialize() {
    try {
        // We only import config to check for its existence.
        // main.js will import it again to get the values.
        // This dynamic import will throw if the file doesn't exist.
        await import('./js/config.js');

        // If the import succeeds, we can then load the main application logic.
        await import('./js/main.js');
    } catch (error) {
        // A more specific error message for module not found.
        // Different browsers have different error messages.
        const errorString = error.toString();
        if (errorString.includes('Failed to fetch') || errorString.includes('module not found')) {
            showModal("CRITICAL: Configuration file 'js/config.js' is missing. Please create it by copying 'js/config.js.example' and provide your configuration details.");
        } else {
            showModal(`An unexpected error occurred: ${error.message}`);
        }
        console.error("Initialization failed:", error);
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
    }
}

initialize();
