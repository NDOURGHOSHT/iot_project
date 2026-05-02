#include <Arduino.h>
#include <DHT.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// CAPTEURS
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

int mqPin    = 35;
int ldrPin   = 34;
const int anemoPin = 27;

// RELAIS
#define PIN_LAMPE1      25
#define PIN_LAMPE2      26
#define PIN_VENTILATEUR 14
#define PIN_FENETRE1    33
#define PIN_FENETRE2    32
#define PIN_SPARE       12

// WIFI
const char* ssid     = "_wifi_";
const char* password = "64676869";

// SERVER
const char* serverData = "http://192.168.43.48:5000/api/data";
const char* serverCmd  = "http://192.168.43.48:5000/api/commands";

// seuils auto
int seuilGaz  = 2000;
float seuilTemp = 30.0;

volatile int pulseCount = 0;

void IRAM_ATTR countPulse() {
  pulseCount++;
}

void setup() {
  Serial.begin(115200);
  dht.begin();

  // relais
  pinMode(PIN_LAMPE1,      OUTPUT);
  pinMode(PIN_LAMPE2,      OUTPUT);
  pinMode(PIN_VENTILATEUR, OUTPUT);
  pinMode(PIN_FENETRE1,    OUTPUT);
  pinMode(PIN_FENETRE2,    OUTPUT);
  pinMode(PIN_SPARE,       OUTPUT);

  // tout éteint au démarrage
  digitalWrite(PIN_LAMPE1,      LOW);
  digitalWrite(PIN_LAMPE2,      LOW);
  digitalWrite(PIN_VENTILATEUR, LOW);
  digitalWrite(PIN_FENETRE1,    LOW);
  digitalWrite(PIN_FENETRE2,    LOW);
  digitalWrite(PIN_SPARE,       LOW);

  pinMode(anemoPin, INPUT);
  attachInterrupt(digitalPinToInterrupt(anemoPin), countPulse, FALLING);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connecté");
}

void applyCommands(String payload) {
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, payload);
  if (error) {
    Serial.println("JSON erreur");
    return;
  }

  String mode = doc["mode"] | "auto";

  if (mode == "manuel") {
    // Flask contrôle tout
    digitalWrite(PIN_LAMPE1,      doc["lampe1"]      ? HIGH : LOW);
    digitalWrite(PIN_LAMPE2,      doc["lampe2"]      ? HIGH : LOW);
    digitalWrite(PIN_VENTILATEUR, doc["ventilateur"] ? HIGH : LOW);
    digitalWrite(PIN_FENETRE1,    doc["fenetre1"]    ? HIGH : LOW);
    digitalWrite(PIN_FENETRE2,    doc["fenetre2"]    ? HIGH : LOW);
    Serial.println("Mode manuel appliqué");
  } else {
    Serial.println("Mode auto — ESP32 gère");
  }
}

void autoControl(float temp, int gaz, int ldr) {
  // ventilateur si temp trop haute
  digitalWrite(PIN_VENTILATEUR, temp > seuilTemp ? HIGH : LOW);

  // ventilation si gaz dangereux
  if (gaz > seuilGaz) {
    digitalWrite(PIN_FENETRE1, HIGH);
    digitalWrite(PIN_FENETRE2, HIGH);
  } else {
    digitalWrite(PIN_FENETRE1, LOW);
    digitalWrite(PIN_FENETRE2, LOW);
  }

  // lampes si luminosité faible (nuit)
  if (ldr < 500) {
    digitalWrite(PIN_LAMPE1, HIGH);
    digitalWrite(PIN_LAMPE2, HIGH);
  } else {
    digitalWrite(PIN_LAMPE1, LOW);
    digitalWrite(PIN_LAMPE2, LOW);
  }
}

void loop() {
  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();
  int ldr    = analogRead(ldrPin);
  int gaz    = analogRead(mqPin);

  float frequency = pulseCount / 2.0;
  float windSpeed = frequency * 1.0;
  pulseCount = 0;

  Serial.println("------");
  Serial.print("Temp: ");  Serial.println(temp);
  Serial.print("Hum: ");   Serial.println(hum);
  Serial.print("LDR: ");   Serial.println(ldr);
  Serial.print("MQ135: "); Serial.println(gaz);
  Serial.print("Vent: ");  Serial.println(windSpeed);

  if (WiFi.status() == WL_CONNECTED) {

    // envoi données capteurs
    HTTPClient http;
    http.begin(serverData);
    http.addHeader("Content-Type", "application/json");

    String jsonData = "{";
    jsonData += "\"temperature\":" + String(temp) + ",";
    jsonData += "\"humidity\":"    + String(hum)  + ",";
    jsonData += "\"ldr\":"         + String(ldr)  + ",";
    jsonData += "\"mq135\":"       + String(gaz)  + ",";
    jsonData += "\"wind\":"        + String(windSpeed);
    jsonData += "}";

    int httpCode = http.POST(jsonData);
    Serial.print("POST HTTP: "); Serial.println(httpCode);
    http.end();

    // lecture commandes Flask
    HTTPClient httpCmd;
    httpCmd.begin(serverCmd);
    int cmdCode = httpCmd.GET();
    Serial.print("CMD HTTP: "); Serial.println(cmdCode);

    if (cmdCode == 200) {
      String payload = httpCmd.getString();
      String mode = "";

      // vérifier le mode avant d'agir
      JsonDocument doc;
      deserializeJson(doc, payload);
      mode = doc["mode"] | "auto";

      if (mode == "auto") {
        autoControl(temp, gaz, ldr);
      } else {
        applyCommands(payload);
      }
    }
    httpCmd.end();
  }

  delay(5000);
}