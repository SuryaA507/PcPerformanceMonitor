# PC Performance Monitor Dashboard

A beginner-friendly real-time PC monitoring dashboard built with UiPath, PowerShell, HTML, CSS, JavaScript, and JSON file exchange.

The project works like a lightweight Task Manager dashboard. UiPath runs the backend monitor, PowerShell collects system performance data, writes it to `dashboard/performance.json`, and the browser dashboard refreshes that JSON every few seconds.

## Features

- Live CPU usage
- Live RAM usage
- Live GPU usage
- Top CPU-consuming apps
- Top RAM-consuming apps
- Apps currently using GPU
- Auto-refresh every 3 seconds
- Modern dark dashboard UI
- Progress bars and live tables
- JSON-based communication between UiPath and frontend
- Debug log on the dashboard
- CSV export
- Excel-compatible `.xls` export
- Live Server friendly file structure

## Tech Stack

- UiPath Studio
- PowerShell
- HTML
- CSS
- JavaScript
- JSON
- VS Code Live Server

## Folder Structure

```text
PcPerformanceMonitorDashboard/
|
+-- dashboard/
|   +-- index.html
|   +-- style.css
|   +-- script.js
|   +-- performance.json
|   +-- dashboard/
|       +-- index.html
|
+-- logs/
+-- Main.xaml
+-- MonitorPerformance.ps1
+-- project.json
+-- README.md
```

Important: `performance.json` must stay inside the `dashboard` folder. The frontend fetches:

```javascript
fetch("./performance.json")
```

This avoids Live Server problems caused by trying to fetch JSON from a parent folder.

## How It Works

```text
UiPath Main.xaml
    runs MonitorPerformance.ps1 every 3 seconds
        collects CPU, RAM, GPU, and process data
        writes dashboard/performance.json
            dashboard/script.js fetches performance.json
                browser updates cards, tables, progress bars, and export data
```

## Main Files

| File | Purpose |
|---|---|
| `Main.xaml` | UiPath workflow entry point |
| `MonitorPerformance.ps1` | Collects PC performance data and writes JSON |
| `dashboard/index.html` | Dashboard layout |
| `dashboard/style.css` | Dark UI styling |
| `dashboard/script.js` | Fetch, render, auto-refresh, debug, and export logic |
| `dashboard/performance.json` | Live data file written by UiPath/PowerShell |
| `logs/monitor.log` | Backend update log |

## JSON Format

The dashboard expects this JSON structure:

```json
{
  "cpu": 49.7,
  "ram": 78.5,
  "gpu": 84.9,
  "topCpuApps": [
    {
      "name": "acshadows",
      "cpu": 28.4
    }
  ],
  "topRamApps": [
    {
      "name": "chrome",
      "memoryMb": 854.4
    }
  ],
  "gpuApps": [
    {
      "name": "ACShadows",
      "engine": "3D",
      "gpu": 84
    }
  ],
  "updatedAt": "2026-05-29 10:46:25"
}
```

The frontend also supports older UiPath field names like `topApps`, `topGpuApps`, `ProcessName`, `CPU`, `GPU`, and `RAM_MB`.

## PowerShell Commands Used

CPU usage:

```powershell
(Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples.CookedValue
```

RAM usage:

```powershell
(Get-Counter '\Memory\% Committed Bytes In Use').CounterSamples.CookedValue
```

GPU usage:

```powershell
Get-Counter '\GPU Engine(*)\Utilization Percentage'
```

Top CPU apps:

```powershell
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 ProcessName,CPU
```

The project version in `MonitorPerformance.ps1` uses additional shaping logic so the dashboard receives clean arrays for CPU, RAM, and GPU app tables.

## Run The UiPath Backend

1. Open the project folder in UiPath Studio.
2. Open `Main.xaml`.
3. Run the workflow.
4. UiPath will run `MonitorPerformance.ps1` every 3 seconds.
5. Confirm `dashboard/performance.json` is changing.

You can also test the PowerShell backend manually:

```powershell
powershell -ExecutionPolicy Bypass -File .\MonitorPerformance.ps1
```

## Launch The Dashboard

1. Open the project in VS Code.
2. Install the Live Server extension if needed.
3. Right-click `dashboard/index.html`.
4. Select `Open with Live Server`.

Depending on the Live Server root, use one of these URLs:

```text
http://127.0.0.1:5500/
```

or:

```text
http://127.0.0.1:5500/dashboard/index.html
```

If you see `ERR_CONNECTION_REFUSED`, Live Server is not running.

## Export Data

The dashboard has export buttons in the Debug Log section:

- `Export CSV`
- `Export Excel`

The export includes:

- Summary CPU/RAM/GPU usage
- Top CPU apps
- Top RAM apps
- GPU apps
- Last update timestamp

The Excel export creates an Excel-compatible `.xls` file using browser-only JavaScript, so no extra library is required.

## Troubleshooting

### Dashboard Opens But Values Stay 0

Check `dashboard/performance.json`. If the values are 0 there too, the backend is not writing live data.

### JSON Fetch Failed

Open DevTools with `F12`, then check the Console and Network tabs.

Expected result:

```text
performance.json -> Status 200
```

Common causes:

- Page opened as `file:///...` instead of Live Server
- Live Server is not running
- `performance.json` is outside the `dashboard` folder
- JSON file is invalid while UiPath is writing it

### GPU Apps Not Showing

GPU apps only appear when Windows reports active GPU engine usage for a process. If no process is using GPU, the dashboard shows:

```text
No active GPU apps found.
```

If GPU usage is high but no apps show, refresh with:

```text
Ctrl + F5
```

Also make sure the JSON contains either `gpuApps` or `topGpuApps`.

### Live Server URL Confusion

If Live Server serves the `dashboard` folder directly, use:

```text
http://127.0.0.1:5500/
```

If Live Server serves the whole project folder, use:

```text
http://127.0.0.1:5500/dashboard/index.html
```

### Old UiPath Workflow Overwrites JSON

Stop any old UiPath run and run the current `Main.xaml`. Older workflows may write only CPU/RAM or use old field names.

## Development Notes

- `script.js` fetches `./performance.json` with cache busting.
- PowerShell writes JSON through a temporary file before replacing `performance.json`.
- This reduces the chance of the browser reading partially written JSON.
- The dashboard refreshes automatically every 3 seconds.
- The `logs/monitor.log` file records backend updates.

## Beginner Test

To confirm the frontend works, manually replace `dashboard/performance.json` with:

```json
{
  "cpu": 77,
  "ram": 64,
  "gpu": 33,
  "topCpuApps": [
    { "name": "manual-cpu-test", "cpu": 77 }
  ],
  "topRamApps": [
    { "name": "manual-ram-test", "memoryMb": 512 }
  ],
  "gpuApps": [
    { "name": "manual-gpu-test", "engine": "3D", "gpu": 33 }
  ],
  "updatedAt": "manual test"
}
```

The dashboard should update within 3 seconds.

## Project Status

Complete working project:

- UiPath backend architecture ready
- PowerShell monitoring script included
- Dashboard frontend complete
- Live JSON fetch working
- GPU app table supported
- CSV and Excel export supported
