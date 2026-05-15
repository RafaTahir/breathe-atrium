# BreatheAtrium System Architecture

BreatheAtrium is a mixed-mode atrium retrofit. The passive system moves air; the sensor system proves what happened; the dashboard turns the pilot into a commercial decision.

The architecture has four connected layers:

- **Physical retrofit:** low-level air inlets, occupied-zone cross-flow, solar chimney or high-level exhaust, hot-air release, and optional water wall.
- **Sensor and edge layer:** temperature, humidity, airflow, and CO2 readings collected through an ESP32 or simple sensor gateway.
- **Operations layer:** live monitoring, BMS coordination, damper/HVAC handoff, alerts, ROI assumptions, and pilot reporting.
- **Human workflow:** facility manager, installer, researcher, and building owner each get a clear role.

## System Diagram

```mermaid
flowchart LR
  subgraph Roles["Human roles"]
    Owner["Building owner"]
    Facility["Facility manager"]
    Installer["Installer / MEP partner"]
    Researcher["Researcher / validation lead"]
  end

  subgraph Atrium["Physical atrium retrofit"]
    Space["Overheated glass atrium"]
    Inlets["Low-level air inlets"]
    CrossFlow["Occupied-zone cross ventilation"]
    WaterWall["Optional water wall"]
    Chimney["Solar chimney / high-level exhaust"]
    Release["Hot-air release"]
  end

  subgraph SensorLayer["Sensor layer"]
    Temp["Temperature sensors"]
    Humidity["Humidity sensors"]
    Airflow["Airflow sensors"]
    CO2["CO2 sensors"]
  end

  subgraph Edge["Edge controller"]
    Gateway["ESP32 or sensor gateway"]
    Serial["Serial JSON / local stream"]
  end

  subgraph Controls["BMS integration"]
    Dampers["Dampers"]
    HVAC["HVAC coordination"]
    Alerts["Alerts and operating rules"]
  end

  subgraph Studio["BreatheAtrium Studio dashboard"]
    Live["Live monitoring"]
    ROI["ROI calculator"]
    Pilot["Pilot report"]
  end

  Owner --> Facility
  Facility --> Space
  Facility --> Live
  Facility --> Pilot
  Installer --> Inlets
  Installer --> Chimney
  Installer --> Dampers
  Researcher --> Pilot

  Space --> Inlets
  Inlets --> CrossFlow
  WaterWall --> CrossFlow
  CrossFlow --> Chimney
  Chimney --> Release

  Space --> Temp
  Space --> Humidity
  CrossFlow --> Airflow
  Space --> CO2

  Temp --> Gateway
  Humidity --> Gateway
  Airflow --> Gateway
  CO2 --> Gateway
  Gateway --> Serial
  Serial --> Live

  Live --> ROI
  Live --> Pilot
  Pilot --> Owner
  ROI --> Owner

  Live --> Alerts
  Alerts --> Facility
  Alerts --> BMS["BMS"]
  BMS --> Dampers
  BMS --> HVAC
  Dampers --> Inlets
  HVAC --> CrossFlow
```

**Explanation:** the passive architecture creates the airflow path, while the sensor gateway gives the dashboard enough evidence to show what changed. BMS integration keeps BreatheAtrium positioned as a mixed-mode system that coordinates with HVAC rather than pretending to replace it.

Source file: `docs/architecture/system-architecture.mmd`

## User Flow

```mermaid
flowchart TD
  Pain["Facility manager feels atrium heat pain"]
  Request["Audit request"]
  Baseline["Baseline sensor mapping"]
  Recommend["Design recommendation"]
  Pilot["90-day pilot"]
  Verify["Verification report"]
  Decision{"Commercial decision"}
  Retrofit["Full retrofit"]
  Monitor["Monitoring subscription"]
  Redesign["Revise scope or stop"]

  Pain --> Request
  Request --> Baseline
  Baseline --> Recommend
  Recommend --> Pilot
  Pilot --> Verify
  Verify --> Decision
  Decision -->|Proceed| Retrofit
  Decision -->|Not ready| Redesign
  Retrofit --> Monitor
  Monitor --> Baseline
```

**Explanation:** the buyer path is deliberately conservative. BreatheAtrium starts with the facility manager's pain, converts that pain into an audit, proves the intervention in a 90-day pilot, then asks for a full retrofit only after a verification report.

Source file: `docs/architecture/user-flow.mmd`

## Data Flow

```mermaid
flowchart LR
  subgraph Field["Atrium field layer"]
    T["Temperature"]
    H["Humidity"]
    A["Airflow"]
    C["CO2"]
  end

  subgraph Gateway["Edge gateway"]
    ESP["ESP32 / sensor gateway"]
    Validate["Validate payload"]
    Label["Label data status: simulated / CSV / serial / measured"]
  end

  subgraph App["BreatheAtrium Studio"]
    Stream["Live sensor stream"]
    Chart["Dashboard charts and cards"]
    ROI["ROI assumptions"]
    Report["Pilot report"]
  end

  subgraph Decision["Commercial decision"]
    Evidence["Verification evidence"]
    Buyer["Building owner / facility manager"]
    Action["Retrofit, redesign, or stop"]
  end

  T --> ESP
  H --> ESP
  A --> ESP
  C --> ESP
  ESP --> Validate
  Validate --> Label
  Label --> Stream
  Stream --> Chart
  Stream --> Report
  ROI --> Report
  Chart --> Evidence
  Report --> Evidence
  Evidence --> Buyer
  Buyer --> Action
```

**Explanation:** the demo can use simulated or CSV data, while pilot deployments can use serial or measured sensor data. Every data path must preserve status labels so simulated assumptions are never confused with measured pilot evidence.

Source file: `docs/architecture/data-flow.mmd`

## Presentation Notes

- Lead with the physical airflow path: inlet, occupied-zone cross-flow, solar-assisted exhaust, high-level release.
- Then show measurement: sensors, gateway, dashboard, pilot report.
- Close with commercialization: facility pain becomes an audit, pilot, verification report, retrofit, and monitoring subscription.
- Keep the claim disciplined: BreatheAtrium reduces heat build-up and cooling burden where site conditions support it; results require measurement.
