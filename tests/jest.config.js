export default {
    "testEnvironment": "jsdom",
    "transform": {
      "^.+\\.js$": "babel-jest"
    },
    "moduleNameMapper": {
      "^../js/uiElements.js$": "<rootDir>/__mocks__/uiElements.js",
      "^./uiElements.js$": "<rootDir>/__mocks__/uiElements.js",
      "^./config.js$": "<rootDir>/__mocks__/config.js",
      "^./chartManager.js$": "<rootDir>/__mocks__/chartManager.js",
      "^./dataService.js$": "<rootDir>/__mocks__/dataService.js",
      "^./utils.js$": "<rootDir>/__mocks__/utils.js"
    }
  }
