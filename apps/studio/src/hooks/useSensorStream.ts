import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import demoRunCsv from "../../../../assets/demo-data/demo-run.csv?raw";
import {
  createScriptedDemoRunReadings,
  createSimulatedReading,
  parseSensorCsv,
  parseSerialReading,
  sensorSourceLabels,
  type SensorMode,
  type SensorReading,
  type SensorSource,
} from "../lib/sensorData";

export type SensorStreamStatus = "idle" | "running" | "complete" | "connecting" | "unsupported" | "error";

type BrowserSerial = {
  requestPort: () => Promise<SerialPortLike>;
};

type SerialPortLike = {
  readable: ReadableStream<Uint8Array> | null;
  open: (options: { baudRate: number }) => Promise<void>;
  close: () => Promise<void>;
};

const maxHistoryLength = 48;

export function useSensorStream() {
  const csvReadings = useMemo(() => parseSensorCsv(demoRunCsv), []);
  const serialSupported = typeof navigator !== "undefined" && "serial" in navigator;
  const [source, setSourceState] = useState<SensorSource>("simulated");
  const [mode, setMode] = useState<SensorMode>("breathe_atrium");
  const [reading, setReading] = useState<SensorReading>(() => createSimulatedReading("breathe_atrium", 12));
  const [history, setHistory] = useState<SensorReading[]>(() => createInitialSimulatedHistory("breathe_atrium"));
  const [status, setStatus] = useState<SensorStreamStatus>("running");
  const [statusMessage, setStatusMessage] = useState("Simulated fallback is running with realistic drifting values.");
  const [isDemoRunActive, setIsDemoRunActive] = useState(false);
  const tickRef = useRef(1);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const portRef = useRef<SerialPortLike | null>(null);
  const serialStopRef = useRef(false);

  const appendReading = useCallback((nextReading: SensorReading) => {
    setReading(nextReading);
    setMode(nextReading.mode);
    setHistory((current) => [...current, nextReading].slice(-maxHistoryLength));
  }, []);

  const primeReading = useCallback((nextReading: SensorReading) => {
    setReading(nextReading);
    setMode(nextReading.mode);
    setHistory([nextReading]);
  }, []);

  const closeSerialTransport = useCallback(async () => {
    serialStopRef.current = true;

    try {
      await readerRef.current?.cancel();
    } catch {
      // Closing a reader can throw if the browser already released the stream.
    }

    try {
      readerRef.current?.releaseLock();
    } catch {
      // Some serial implementations release the lock during cancel.
    }

    readerRef.current = null;

    try {
      await portRef.current?.close();
    } catch {
      // A failed close should not interrupt the offline demo path.
    }

    portRef.current = null;
  }, []);

  const disconnectSerial = useCallback(async () => {
    await closeSerialTransport();
    setStatus("idle");
    setStatusMessage("Hardware serial disconnected. Simulated and CSV fallback remain available.");
  }, [closeSerialTransport]);

  const connectSerial = useCallback(async () => {
    const serial = (navigator as Navigator & { serial?: BrowserSerial }).serial;

    if (!serialSupported || !serial) {
      setStatus("unsupported");
      setStatusMessage("Web Serial is not supported in this browser. Use Simulated or CSV Playback for the pitch.");
      return;
    }

    serialStopRef.current = false;
    setStatus("connecting");
    setStatusMessage("Waiting for a serial device selection...");

    try {
      const port = await serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;

      if (!port.readable) {
        throw new Error("Selected serial device is not readable.");
      }

      const reader = port.readable.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";

      setStatus("running");
      setStatusMessage("Hardware serial is connected. Expect newline-delimited JSON readings.");

      while (!serialStopRef.current) {
        const { value, done } = await reader.read();
        if (done || !value) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const serialReading = parseSerialReading(line.trim());
          if (serialReading) appendReading(serialReading);
        }
      }
    } catch (error) {
      if (!serialStopRef.current) {
        setStatus("error");
        setStatusMessage(error instanceof Error ? error.message : "Serial connection failed. Use fallback demo modes.");
      }
    } finally {
      try {
        readerRef.current?.releaseLock();
      } catch {
        // Browser-specific serial cleanup can be noisy; keep the UI stable.
      }
      readerRef.current = null;
    }
  }, [appendReading, serialSupported]);

  const setSource = useCallback(
    (nextSource: SensorSource) => {
      setSourceState(nextSource);
      setIsDemoRunActive(false);

      if (nextSource !== "serial") {
        void closeSerialTransport();
      }

      if (nextSource === "simulated") {
        const seededHistory = createInitialSimulatedHistory(mode, tickRef.current);
        tickRef.current += seededHistory.length;
        setReading(seededHistory[seededHistory.length - 1]);
        setHistory(seededHistory);
        setStatus("running");
        setStatusMessage("Simulated fallback is running with realistic drifting values.");
      }

      if (nextSource === "csv") {
        if (csvReadings.length > 0) {
          primeReading(csvReadings[0]);
          setStatus("idle");
          setStatusMessage(`${csvReadings.length} CSV rows loaded. Press Start Demo Run to replay the before/after sequence.`);
        } else {
          setStatus("error");
          setStatusMessage("CSV playback file is empty or malformed. Simulated mode is still available.");
        }
      }

      if (nextSource === "serial") {
        if (serialSupported) {
          setStatus("idle");
          setStatusMessage("Hardware mode is optional. Connect a Web Serial device when available.");
        } else {
          setStatus("unsupported");
          setStatusMessage("Web Serial is not supported in this browser. Use Simulated or CSV Playback for the pitch.");
        }
      }
    },
    [closeSerialTransport, csvReadings, mode, primeReading, serialSupported],
  );

  const startDemoRun = useCallback(() => {
    if (source === "serial") {
      void connectSerial();
      return;
    }

    setHistory([]);
    setIsDemoRunActive(true);
  }, [connectSerial, source]);

  const stopDemoRun = useCallback(() => {
    if (source === "serial") {
      void disconnectSerial();
      return;
    }

    setIsDemoRunActive(false);
    setStatus("idle");
    setStatusMessage(`${sensorSourceLabels[source]} demo run paused. Press Start Demo Run to replay.`);
  }, [disconnectSerial, source]);

  useEffect(() => {
    if (source !== "simulated" || isDemoRunActive) return;

    setStatus("running");
    setStatusMessage("Simulated fallback is running with realistic drifting values.");

    const pushReading = () => {
      appendReading(createSimulatedReading(mode, tickRef.current++));
    };

    pushReading();
    const timer = window.setInterval(pushReading, 1200);
    return () => window.clearInterval(timer);
  }, [appendReading, isDemoRunActive, mode, source]);

  useEffect(() => {
    if (!isDemoRunActive || source === "serial") return;

    const playbackReadings = source === "csv" ? csvReadings : createScriptedDemoRunReadings();

    if (playbackReadings.length === 0) {
      setStatus("error");
      setStatusMessage("No playback rows are available. Switch to Simulated mode for a safe fallback.");
      setIsDemoRunActive(false);
      return;
    }

    let index = 0;
    setStatus("running");
    setStatusMessage(
      source === "csv"
        ? "CSV playback is replaying a saved demo run."
        : "Simulated demo run is showing before/after data over time.",
    );

    let timer: number | undefined;

    const playNext = () => {
      appendReading(playbackReadings[index]);
      index += 1;

      if (index >= playbackReadings.length) {
        if (timer !== undefined) window.clearInterval(timer);
        setIsDemoRunActive(false);
        setStatus("complete");
        setStatusMessage(`${sensorSourceLabels[source]} demo run complete. The fallback remains ready to replay.`);
      }
    };

    playNext();
    timer = window.setInterval(playNext, 900);
    return () => {
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [appendReading, csvReadings, isDemoRunActive, source]);

  useEffect(() => {
    return () => {
      serialStopRef.current = true;
      void readerRef.current?.cancel();
      void portRef.current?.close();
    };
  }, []);

  const dataLabel = source === "simulated" ? "SIMULATED DATA" : source === "csv" ? "CSV PLAYBACK" : "HARDWARE SERIAL";

  return {
    source,
    setSource,
    mode,
    setMode,
    reading,
    history,
    status,
    statusMessage,
    serialSupported,
    isDemoRunActive,
    startDemoRun,
    stopDemoRun,
    dataLabel,
    csvRowCount: csvReadings.length,
  };
}

function createInitialSimulatedHistory(mode: SensorMode, startTick = 0) {
  const now = Date.now();

  return Array.from({ length: 12 }, (_, index) =>
    createSimulatedReading(mode, startTick + index, new Date(now - (11 - index) * 1200)),
  );
}
