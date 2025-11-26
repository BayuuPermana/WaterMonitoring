import { translations } from './translations.js';

export class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('lang') || 'en';
        this.translations = translations;
        this.listeners = [];
    }

    init() {
        this.updateLanguage(this.currentLang);
        this.setupEventListeners();
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        this.listeners.forEach(cb => cb(this.currentLang));
    }

    setupEventListeners() {
        const langToggleBtn = document.getElementById('langToggle');
        if (langToggleBtn) {
            langToggleBtn.addEventListener('click', () => {
                this.toggleLanguage();
            });
        }
    }

    toggleLanguage() {
        this.currentLang = this.currentLang === 'en' ? 'id' : 'en';
        localStorage.setItem('lang', this.currentLang);
        this.updateLanguage(this.currentLang);
        this.notifyListeners();
    }

    updateLanguage(lang) {
        // Update all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (this.translations[lang] && this.translations[lang][key]) {
                // Check if element has child nodes that are not text (like icons)
                // We want to preserve the icon and only update the text
                const icon = element.querySelector('svg');
                if (icon) {
                    // If there's an icon, we assume the text is in a text node or span after it
                    // For simplicity in this project, we can just update the text node
                    // But a safer way for the buttons with icons is to find the text node

                    // Let's try to find the text node
                    let textNode = null;
                    for (let i = 0; i < element.childNodes.length; i++) {
                        if (element.childNodes[i].nodeType === Node.TEXT_NODE && element.childNodes[i].textContent.trim().length > 0) {
                            textNode = element.childNodes[i];
                            break;
                        }
                    }

                    if (textNode) {
                        textNode.textContent = " " + this.translations[lang][key]; // Add space for separation
                    } else {
                        // Fallback if structure is different, just append text
                        // This might duplicate if not careful, but for now let's assume standard structure
                        // Or better, just replace the last child if it is text
                        if (element.lastChild.nodeType === Node.TEXT_NODE) {
                            element.lastChild.textContent = " " + this.translations[lang][key];
                        } else {
                            element.appendChild(document.createTextNode(" " + this.translations[lang][key]));
                        }
                    }
                } else {
                    element.textContent = this.translations[lang][key];
                }
            }
        });

        // Update button text
        const langToggleBtn = document.getElementById('langToggle');
        if (langToggleBtn) {
            langToggleBtn.textContent = lang === 'en' ? 'ID' : 'EN';
        }
    }

    // Helper to get translation for dynamic content
    t(key) {
        return this.translations[this.currentLang][key] || key;
    }
}

export const i18n = new I18n();
