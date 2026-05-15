/*
  BreatheAtrium ESP32 Sensor Stream Prototype

  Status: simulated telemetry only.
  Replace the simulated values with real sensor reads during pilot hardware integration.
*/

const unsigned long STREAM_INTERVAL_MS = 2000;
unsigned long lastStreamAt = 0;

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("{\"device\":\"breatheatrium-esp32\",\"status\":\"boot\",\"data\":\"simulated\"}");
}

void loop() {
  unsigned long now = millis();
  if (now - lastStreamAt < STREAM_INTERVAL_MS) {
    return;
  }

  lastStreamAt = now;
  float phase = (now / 1000.0) / 30.0;

  float occupiedTempC = 30.5 + sin(phase) * 0.6;
  float roofLayerTempC = 38.0 + cos(phase * 0.7) * 1.1;
  float relativeHumidityPct = 64.0 + sin(phase * 0.5) * 3.0;
  int co2Ppm = 620 + int(sin(phase * 0.8) * 40);
  int damperOpeningPct = 72 + int(cos(phase) * 5);
  int airflowIndex = 68 + int(sin(phase * 0.9) * 8);

  Serial.print("{\"device\":\"breatheatrium-esp32\",");
  Serial.print("\"data\":\"simulated\",");
  Serial.print("\"occupiedTempC\":");
  Serial.print(occupiedTempC, 1);
  Serial.print(",\"roofLayerTempC\":");
  Serial.print(roofLayerTempC, 1);
  Serial.print(",\"relativeHumidityPct\":");
  Serial.print(relativeHumidityPct, 1);
  Serial.print(",\"co2Ppm\":");
  Serial.print(co2Ppm);
  Serial.print(",\"damperOpeningPct\":");
  Serial.print(damperOpeningPct);
  Serial.print(",\"airflowIndex\":");
  Serial.print(airflowIndex);
  Serial.println("}");
}
