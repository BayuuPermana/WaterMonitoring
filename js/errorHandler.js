// js/errorHandler.js
import { showModal } from './uiElements.js';

/**
 * A centralized function to handle errors.
 * It logs the error to the console and shows a user-friendly message in a modal.
 * @param {Error} error - The error object.
 * @param {string} userMessage - A user-friendly message to display.
 */
export function handleError(error, userMessage) {
    console.error(userMessage, error);
    showModal(userMessage, 'error');
}
