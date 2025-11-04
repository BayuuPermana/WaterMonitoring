// jest.config.js
module.exports = {
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '../js/config.js': '<rootDir>/tests/__mocks__/config.js',
        './config.js': '<rootDir>/tests/__mocks__/config.js',
        './uiElements.js': '<rootDir>/tests/__mocks__/uiElements.js',
        './errorHandler.js': '<rootDir>/tests/__mocks__/errorHandler.js',
    },
};
