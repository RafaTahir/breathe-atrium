# ESP32 Sensor Stream Prototype

This folder contains a minimal Arduino/ESP32 firmware sketch for a simulated sensor stream.

## Purpose

The pitch prototype can use an ESP32 to demonstrate future telemetry from:

- Atrium occupied-zone temperature.
- Roof-layer temperature.
- Relative humidity.
- CO2.
- Damper opening.
- Airflow proxy.

## Current State

`esp32-sensor-stream.ino` emits simulated JSON over Serial. It does not represent measured building performance.

## Next Hardware Step

Replace simulated functions with real sensor reads after the pilot team selects:

- Temperature and humidity sensor.
- CO2 sensor.
- Damper position input.
- Airflow proxy or differential pressure sensor.
- Wi-Fi or wired gateway strategy.
