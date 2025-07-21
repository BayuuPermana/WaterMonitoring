#include <WiFiManager.h>          // https://github.com/tzapu/WiFiManager
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <time.h>

#define TRIGGER_PIN 0 // Pin untuk memicu WiFiManager portal atau reset

// --- Konfigurasi WiFi & Server ---
const char* ssid_default = "watersen";
const char* password_default = "12345678";
const char* googleSheetWebAppUrl = "YOUR_GOOGLE_SHEET_WEB_APP_URL"; // !!! GANTI INI !!!
String apiKey = "YOUR_API_KEY";

// --- WiFiManager ---
WiFiManager wm;
bool wm_nonblocking = false;

// --- Konfigurasi Sensor ---
#define VREF 3.3f
#define ADC_RESOLUTION 4095.0f
#define SCOUNT 10

#define TEMP_SENSOR_PIN 25
OneWire oneWire(TEMP_SENSOR_PIN);
DallasTemperature tempSensors(&oneWire);
float currentTemperature = -127.0f;

#define TDS_SENSOR_PIN 39
int analogBufferTds[SCOUNT];
float tdsValue = 0.0f;

#define SAL_SENSOR_PIN 32
int analogBufferSal[SCOUNT];
float salinityValue = 0.0f;

#define PH_SENSOR_PIN 34
int analogBufferPh[SCOUNT];
float phValue = 0.0f;

#define TURB_SENSOR_PIN 35
int analogBufferTurb[SCOUNT];
float turbidityValue = 0.0f;

// --- NTP Client untuk Waktu ---
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "time.google.com", 7 * 3600); // GMT+7
char formattedTimestamp[25];
char urlEncodedTimestamp[70];

// Variabel global untuk melacak status dan waktu update NTP
unsigned long lastSuccessfulNtpUpdateTime = 0;
unsigned long lastNtpAttemptInLoopTime = 0;


String urlEncode(const char* str) {
  String encodedString = "";
  char c;
  char code0;
  char code1;
  for (unsigned int i = 0; i < strlen(str); i++) {
    c = str[i];
    if (c == ' ') {
      encodedString += "%20";
    } else if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') {
      encodedString += c;
    } else {
      code1 = (c & 0xf) + '0';
      if ((c & 0xf) > 9) code1 = (c & 0xf) - 10 + 'A';
      c = (c >> 4) & 0xf;
      code0 = c + '0';
      if (c > 9) code0 = c - 10 + 'A';
      encodedString += '%';
      encodedString += code0;
      encodedString += code1;
    }
  }
  return encodedString;
}

void updateTimestamp() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("NTP: WiFi tidak terhubung, tidak bisa update.");
    strcpy(formattedTimestamp, "N/A");
    strcpy(urlEncodedTimestamp, "N/A");
    return;
  }

  bool ntpUpdated = false;
  const int maxNtpRetries = 3;
  const int ntpRetryDelay = 3000; // Jeda antar percobaan internal (ms)

  for (int i = 0; i < maxNtpRetries; i++) {
    Serial.printf("NTP: Mencoba update (percobaan internal %d/%d)...\n", i + 1, maxNtpRetries);
    if (timeClient.update()) {
      ntpUpdated = true;
      Serial.println("NTP: Update internal berhasil.");
      break;
    }
    Serial.print("NTP: Percobaan update internal gagal. ");
    Serial.print("Sinyal WiFi (RSSI): "); Serial.println(WiFi.RSSI());
    if (i < maxNtpRetries - 1) {
        Serial.println("NTP: Mencoba end() dan begin() client sebelum percobaan berikutnya...");
        timeClient.end();   // Hentikan klien NTP dan UDP terkait
        delay(200);         // Jeda singkat
        timeClient.begin(); // Inisialisasi ulang klien NTP (ini akan memulai ulang UDP juga)
        delay(ntpRetryDelay);
    }
  }

  if (!ntpUpdated) {
    Serial.println("NTP: Gagal update waktu setelah semua percobaan internal.");
    strcpy(formattedTimestamp, "N/A");
    strcpy(urlEncodedTimestamp, "N/A");
    return;
  }

  time_t epochTime = timeClient.getEpochTime();
  struct tm* ptm = localtime(&epochTime);

  sprintf(formattedTimestamp, "%04d-%02d-%02d %02d:%02d:%02d",
          ptm->tm_year + 1900, ptm->tm_mon + 1, ptm->tm_mday,
          ptm->tm_hour, ptm->tm_min, ptm->tm_sec);
  String encoded = urlEncode(formattedTimestamp);
  strncpy(urlEncodedTimestamp, encoded.c_str(), sizeof(urlEncodedTimestamp) - 1);
  urlEncodedTimestamp[sizeof(urlEncodedTimestamp) - 1] = '\0';

  Serial.print("NTP: Timestamp berhasil diperbarui: "); Serial.println(formattedTimestamp);
  // Serial.print("URL Encoded Timestamp: "); Serial.println(urlEncodedTimestamp);
}

float getMedianAnalog(int analogPin, int buffer[], int bufferSize) {
  for (int i = 0; i < bufferSize; i++) {
    buffer[i] = analogRead(analogPin);
    delay(5);
  }
  int sortedBuffer[bufferSize];
  for (int i = 0; i < bufferSize; i++) sortedBuffer[i] = buffer[i];
  for (int j = 0; j < bufferSize - 1; j++) {
    for (int i = 0; i < bufferSize - j - 1; i++) {
      if (sortedBuffer[i] > sortedBuffer[i + 1]) {
        int temp = sortedBuffer[i];
        sortedBuffer[i] = sortedBuffer[i + 1];
        sortedBuffer[i + 1] = temp;
      }
    }
  }
  if (bufferSize % 2 == 1) return sortedBuffer[bufferSize / 2];
  else return (sortedBuffer[bufferSize / 2 - 1] + sortedBuffer[bufferSize / 2]) / 2.0f;
}

void setup() {
  Serial.begin(115200);
  Serial.println("\nMemulai ESP32 Environmental Sensor (Google Sheet Logger)...");

  WiFi.mode(WIFI_STA);
  pinMode(TDS_SENSOR_PIN, INPUT);
  pinMode(SAL_SENSOR_PIN, INPUT);
  pinMode(PH_SENSOR_PIN, INPUT);
  pinMode(TURB_SENSOR_PIN, INPUT);
  pinMode(TRIGGER_PIN, INPUT_PULLUP);

  tempSensors.begin();

  std::vector<const char*> menu = {"wifi", "info", "param", "sep", "restart", "exit"};
  wm.setMenu(menu);
  wm.setClass("invert");
  wm.setAPClientCheck(true);

  Serial.println("Mencoba menghubungkan ke WiFi...");
  if (!wm.autoConnect(ssid_default, password_default)) {
    Serial.println("Gagal terhubung ke WiFi. Mereset ESP32...");
    ESP.restart();
  }
  Serial.println("Berhasil terhubung ke WiFi!");
  Serial.print("Alamat IP: "); Serial.println(WiFi.localIP());

  Serial.println("Memulai NTP Client...");
  timeClient.begin();
  updateTimestamp(); // Dapatkan waktu awal
  if (strcmp(formattedTimestamp, "N/A") != 0) {
    lastSuccessfulNtpUpdateTime = millis(); // Catat waktu sukses pertama jika berhasil
  }
  lastNtpAttemptInLoopTime = millis(); // Catat juga waktu upaya pertama
}

void checkWiFiManagerButton() {
  if (digitalRead(TRIGGER_PIN) == LOW) {
    delay(50);
    if (digitalRead(TRIGGER_PIN) == LOW) {
      Serial.println("Tombol TRIGGER ditekan.");
      unsigned long pressStartTime = millis();
      while (digitalRead(TRIGGER_PIN) == LOW) {
        if (millis() - pressStartTime > 5000) {
          Serial.println("Tombol ditahan lama. Mereset WiFiManager...");
          wm.resetSettings();
          Serial.println("Pengaturan direset. Merestart ESP32.");
          ESP.restart();
          return;
        }
      }
      Serial.println("Membuka portal konfigurasi WiFiManager...");
      wm.setConfigPortalTimeout(180);
      if (!wm.startConfigPortal("ESP32SensorConfigAP")) {
        Serial.println("Portal konfigurasi gagal atau timeout.");
      } else {
        Serial.println("Terhubung ke WiFi melalui portal!");
        Serial.print("Alamat IP baru: "); Serial.println(WiFi.localIP());
      }
    }
  }
}

void readAllSensors() {
  tempSensors.requestTemperatures();
  float tempReading = tempSensors.getTempCByIndex(0);
  if (tempReading == DEVICE_DISCONNECTED_C || tempReading == 85.0 || tempReading == -127.0) {
    Serial.println("Error: Gagal membaca suhu DS18B20.");
  } else {
    currentTemperature = tempReading;
  }

  float medianAnalogTds = getMedianAnalog(TDS_SENSOR_PIN, analogBufferTds, SCOUNT);
  float medianAnalogSal = getMedianAnalog(SAL_SENSOR_PIN, analogBufferSal, SCOUNT);
  float medianAnalogPh = getMedianAnalog(PH_SENSOR_PIN, analogBufferPh, SCOUNT);
  float medianAnalogTurb = getMedianAnalog(TURB_SENSOR_PIN, analogBufferTurb, SCOUNT);

  float voltageTds = medianAnalogTds * (VREF / ADC_RESOLUTION);
  if (currentTemperature > -100) {
      float compCoeff = 1.0f + 0.02f * (currentTemperature - 25.0f);
      float compVoltTds = voltageTds / compCoeff;
      tdsValue = (133.42f*compVoltTds*compVoltTds*compVoltTds - 255.86f*compVoltTds*compVoltTds + 857.39f*compVoltTds)*0.5f;
  } else {
      tdsValue = (133.42f*voltageTds*voltageTds*voltageTds - 255.86f*voltageTds*voltageTds + 857.39f*voltageTds)*0.5f;
  }
  if (tdsValue < 0) tdsValue = 0;

  float voltageSal = medianAnalogSal * (VREF / ADC_RESOLUTION);
  salinityValue = voltageSal * 10.0f; // Kalibrasi!
  if (salinityValue < 0) salinityValue = 0;

  float voltagePh = medianAnalogPh * (VREF / ADC_RESOLUTION);
  phValue = -4.611f * voltagePh + 18.16f; // Kalibrasi!
  if (phValue < 0) phValue = 0; if (phValue > 14) phValue = 14;

  float voltageTurb = medianAnalogTurb * (VREF / ADC_RESOLUTION);
  turbidityValue = -60.606f * voltageTurb + 100.0f; // Kalibrasi!
  if (turbidityValue < 0) turbidityValue = 0;

  Serial.println("\n--- Data Sensor Terbaca ---");
  Serial.print("Suhu: "); Serial.print(currentTemperature, 2); Serial.println(" *C");
  Serial.print("TDS: "); Serial.print(tdsValue, 2); Serial.println(" ppm");
  Serial.print("Salinitas: "); Serial.print(salinityValue, 2); Serial.println(" ppt (?)");
  Serial.print("pH: "); Serial.print(phValue, 2); Serial.println("");
  Serial.print("Turbiditas: "); Serial.print(turbidityValue, 2); Serial.println(" NTU (?)");
  Serial.println("===========================");
}

void sendDataToGoogleSheet() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Sheet: WiFi tidak terhubung."); return;
  }
  if (strcmp(googleSheetWebAppUrl, "URL_WEB_APP_APPS_SCRIPT_ANDA_DI_SINI") == 0) {
    Serial.println("Sheet: ERROR - URL Web App belum diatur!"); return;
  }
  if (strcmp(urlEncodedTimestamp, "N/A") == 0 || strlen(urlEncodedTimestamp) == 0) {
    Serial.println("Sheet: Timestamp N/A, data tidak dikirim."); return;
  }

  WiFiClientSecure clientSecure;
  HTTPClient http;
  clientSecure.setInsecure(); // HANYA UNTUK PENGUJIAN!

  String urlWithParams = String(googleSheetWebAppUrl);
  urlWithParams += "?apiKey=" + apiKey;
  urlWithParams += "&temperature=" + String(currentTemperature, 2);
  urlWithParams += "&tds=" + String(tdsValue, 2);
  urlWithParams += "&salinity=" + String(salinityValue, 2);
  urlWithParams += "&ph=" + String(phValue, 2);
  urlWithParams += "&turbidity=" + String(turbidityValue, 2);
  urlWithParams += "&originalTimestamp=" + String(urlEncodedTimestamp);

  Serial.print("Sheet: Mengirim data...");
  if (urlWithParams.length() > 2048) Serial.print("\nPERINGATAN: URL > 2048 karakter!");
  Serial.println();

  if (http.begin(clientSecure, urlWithParams)) {
    int httpResponseCode = http.GET();
    if (httpResponseCode > 0) {
      Serial.print("Sheet: Kode Respons HTTP: "); Serial.println(httpResponseCode);
      String responsePayload = http.getString();
      Serial.println("Sheet: Respons server: " + responsePayload);
    } else {
      Serial.print("Sheet: Error HTTP: "); Serial.println(httpResponseCode);
      Serial.printf("Sheet: GET gagal, error: %s\n", http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  } else {
    Serial.println("Sheet: Gagal memulai koneksi HTTPS.");
  }
}

unsigned long lastDataSendTime = 0;
const unsigned long dataSendInterval = 4000; // 6 detik
const unsigned long ntpUpdateInterval = 6 * 3600 * 1000UL; // 6 jam

void loop() {
  if (wm_nonblocking) wm.process();
  checkWiFiManagerButton();

  unsigned long currentTime = millis();
  bool attemptNtpUpdateThisCycle = false;

  if (WiFi.status() == WL_CONNECTED) {
    // Kondisi 1: Update pertama kali di loop (lastSuccessfulNtpUpdateTime masih 0 setelah setup)
    // ATAU interval reguler (6 jam) telah tercapai sejak SUKSES terakhir.
    if (lastSuccessfulNtpUpdateTime == 0 || (currentTime - lastSuccessfulNtpUpdateTime >= ntpUpdateInterval)) {
      attemptNtpUpdateThisCycle = true;
      if (lastSuccessfulNtpUpdateTime == 0 && millis() > 5000) { // Hindari langsung setelah setup jika setup sudah update
          Serial.println("NTP: Pemicu update pertama dalam loop (setelah setup).");
      } else if (lastSuccessfulNtpUpdateTime != 0) {
          Serial.println("NTP: Pemicu update interval reguler (6 jam).");
      }
    }
    // Kondisi 2: Jika timestamp saat ini N/A DAN sudah cukup waktu (interval data) sejak UPAYA terakhir di loop.
    // Ini untuk retry yang lebih sering jika waktu belum sinkron.
    else if (strcmp(formattedTimestamp, "N/A") == 0 && (currentTime - lastNtpAttemptInLoopTime >= dataSendInterval)) {
      attemptNtpUpdateThisCycle = true;
      Serial.println("NTP: Pemicu update karena timestamp N/A (interval data).");
    }
  }

  if (attemptNtpUpdateThisCycle) {
    updateTimestamp(); // Fungsi ini memiliki retry internal dengan end()/begin()
    lastNtpAttemptInLoopTime = currentTime; // Catat waktu UPAYA ini
    if (strcmp(formattedTimestamp, "N/A") != 0) {
      lastSuccessfulNtpUpdateTime = currentTime; // Hanya update jika BERHASIL
      Serial.println("NTP: Update SUKSES, lastSuccessfulNtpUpdateTime diperbarui.");
    } else {
      Serial.println("NTP: Update GAGAL setelah semua percobaan dalam updateTimestamp.");
    }
  }

  // Kirim data sensor secara berkala
  if (currentTime - lastDataSendTime >= dataSendInterval || lastDataSendTime == 0) {
    if (WiFi.status() == WL_CONNECTED && strcmp(formattedTimestamp, "N/A") != 0 && strlen(formattedTimestamp) > 0) {
        readAllSensors();
        sendDataToGoogleSheet();
    } else {
        Serial.println("Data: Tidak dikirim (WiFi tidak terhubung atau timestamp N/A).");
    }
    lastDataSendTime = currentTime;
  }
  delay(100);
}
