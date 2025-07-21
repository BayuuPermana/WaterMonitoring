# ESP32 Water Quality Monitoring Dashboard

This project is a complete IoT solution for monitoring water quality in real-time. It uses an ESP32 microcontroller to collect data from various water sensors and sends it to a Google Sheet, which acts as a cloud database. A web-based dashboard then visualizes this data, providing an intuitive interface for users to analyze water quality parameters.

## Features

- **Real-time Monitoring**: View the latest sensor readings for Temperature, TDS (Total Dissolved Solids), Salinity, pH, and Turbidity.
- **Historical Data Visualization**: Interactive charts display trends for each sensor over time.
- **Water Potability Analysis**: An "SVM Analysis" tab provides an instant assessment of whether the water is potable ("Layak") or not ("Tidak Layak") based on Indonesian Ministry of Health (PERMENKES No. 492/2010) standards.
- **Data Export**: Easily download the entire dataset to a CSV file for further analysis.
- **Cloud-Based Backend**: Leverages Google Sheets for a free and simple data storage solution.
- **Responsive Design**: The web dashboard is built with Tailwind CSS for a great experience on both desktop and mobile devices.

## System Architecture

The system consists of three main components:

1.  **ESP32 Data Collector**:
    - The `arduino/aman.ino` sketch runs on an ESP32.
    - It reads data from five connected sensors.
    - It connects to a WiFi network and sends the data via an HTTP GET request to a Google Apps Script web app.

2.  **Google Sheets Backend**:
    - A Google Sheet is used as the database to store all incoming sensor data.
    - A Google Apps Script is deployed as a web app that listens for requests from the ESP32 and writes new rows to the sheet.
    - The `web spreadsheet.txt` file contains the essential IDs and keys for this integration.

3.  **Web Dashboard (Frontend)**:
    - An HTML, CSS, and JavaScript application that runs in any modern web browser.
    - It fetches data directly from the Google Sheet using the Google Sheets API.
    - It uses **Chart.js** to render the data charts and provides the user interface for analysis and export.

## Hardware & Software

### Hardware
- ESP32 Development Board
- Temperature Sensor (DS18B20)
- TDS Sensor
- Salinity Sensor
- pH Sensor
- Turbidity Sensor
- Connecting Wires & Breadboard

### Software & Cloud Services
- [Arduino IDE](https://www.arduino.cc/en/software) or [PlatformIO](https://platformio.org/)
- [ESP32 Board Support for Arduino](https://docs.espressif.com/projects/arduino-esp32/en/latest/installing.html)
- [Google Account](https://www.google.com/) (for Google Sheets and Apps Script)
- A modern web browser (Chrome, Firefox, Edge)

## Setup and Installation

### 1. Google Sheets & Apps Script

1.  **Create a Google Sheet**: Make a new Google Sheet. Note down its **Spreadsheet ID** from the URL.
    - `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
2.  **Set up Headers**: In the first row of your sheet (e.g., `Sheet1`), add the following headers in separate columns: `ServerTimeStamp`, `OriginalTimeStamp`, `apiKey`, `Suhu`, `TDS`, `Salinitas`, `pH`, `Turbiditas`.
3.  **Create Google Apps Script**:
    - Go to `Extensions > Apps Script`.
    - Paste the code from a standard "ESP32 to Google Sheets" tutorial. This script will handle `doGet(e)` requests.
    - Deploy the script as a **Web App**.
    - Grant it the necessary permissions to edit your sheet.
    - Copy the **Web App URL** and the **API Key** (if you implemented one).

### 2. ESP32 Microcontroller

1.  **Configure `aman.ino`**:
    - Open `arduino/aman.ino` in your Arduino IDE.
    - Update the `googleSheetWebAppUrl` variable with your Web App URL.
    - Update the `apiKey` variable if your script uses one.
    - Set your default WiFi credentials in `ssid_default` and `password_default` for the initial connection.
2.  **Install Libraries**: Make sure you have the following Arduino libraries installed:
    - `WiFiManager`
    - `HTTPClient`
    - `NTPClient`
    - `OneWire`
    - `DallasTemperature`
3.  **Upload to ESP32**: Connect your ESP32, select the correct board and port, and upload the sketch.

### 3. Web Dashboard

1.  **Configure `js/config.js`**:
    - Open `js/config.js`.
    - Set `GOOGLE_SHEET_API_KEY` to your Google Cloud Platform API Key with Google Sheets API enabled.
    - Set `SPREADSHEET_ID` to your Google Sheet ID.
    - Set `SHEET_NAME_AND_RANGE` to match your sheet name and data columns (e.g., `SensorData!A:H`).
2.  **Run the Dashboard**:
    - You can run this dashboard by simply opening the `index.html` file in a web browser.
    - For development, it is recommended to use a local web server (like the VS Code Live Server extension) to avoid potential CORS issues with file protocols.

## File Structure

```
.
├── arduino/
│   └── aman.ino             # Code for the ESP32 microcontroller
├── js/
│   ├── chartManager.js      # Manages creation and updates of Chart.js charts
│   ├── config.js            # API keys, spreadsheet IDs, and other settings
│   ├── dataService.js       # Handles fetching and parsing data from Google Sheets
│   ├── main.js              # Main application logic, event listeners, and initialization
│   ├── uiElements.js        # Selectors for all DOM elements
│   └── utils.js             # Utility functions (e.g., CSV conversion)
├── index.html               # The main HTML structure of the dashboard
├── style.css                # Custom styles for the dashboard
├── web spreadsheet.txt      # Contains key IDs and URLs for the backend setup
└── README.md                # This documentation file
```
