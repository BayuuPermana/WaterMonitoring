// tests/__mocks__/uiElements.js
export const showModal = jest.fn();
export const loadingIndicator = {
    classList: {
        add: jest.fn(),
        remove: jest.fn(),
    },
};
