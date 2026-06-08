# PC Performance Monitor Dashboard

A real-time PC performance monitoring dashboard built using **UiPath**, **PowerShell**, **HTML**, **CSS**, **JavaScript**, and **JSON file communication**.

This project works like a lightweight Task Manager dashboard. UiPath runs the backend monitoring bot, PowerShell collects live system performance data, and the frontend dashboard displays CPU, RAM, GPU, and application usage in real time.

## Features

- Live CPU usage monitoring
- Live RAM usage monitoring
- Live GPU usage monitoring
- Top CPU-consuming applications
- Top RAM-consuming applications
- Applications using GPU
- Auto-refreshing dashboard every few seconds
- Modern dark UI
- Animated progress bars
- Tables for application usage
- JSON-based communication between UiPath and frontend
- CSV export
- Excel export
- Debug logs for fetch and JSON issues

## Tech Stack

- UiPath Studio
- PowerShell
- HTML
- CSS
- JavaScript
- JSON
- VS Code Live Server

## Project Structure

```text
PcPerformanceMonitorDashboard/
│
├── dashboard/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── performance.json
│
├── logs/
├── Main.xaml
├── MonitorPerformance.ps1
├── project.json
└── README.md

How It Works
 1.UiPath runs Main.xaml.
 2.UiPath invokes the PowerShell script MonitorPerformance.ps1.
 3.PowerShell collects CPU, RAM, GPU, and process usage data.
 4.The collected data is written to:

  dashboard/performance.json

  5.The dashboard fetches performance.json.
  6.JavaScript updates the UI every few seconds.

JSON Data Format
Example performance.json:

{
  "cpu": 45.2,
  "ram": 67.8,
  "gpu": 30.5,
  "topCpuApps": [
    {
      "name": "chrome",
      "cpu": 15.4
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
  "updatedAt": "2026-06-08 12:30:00"
}

PowerShell Commands Used
CPU usage:

(Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples.CookedValue
RAM usage:

(Get-Counter '\Memory\% Committed Bytes In Use').CounterSamples.CookedValue
GPU usage:

Get-Counter '\GPU Engine(*)\Utilization Percentage'
Top CPU apps:

Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 ProcessName,CPU

How To Run
1. Run UiPath Backend
Open the project in UiPath Studio and run:

Main.xaml
This starts the monitoring bot and updates dashboard/performance.json.

2. Run Dashboard
Open the project in VS Code.

Right-click:

dashboard/index.html
Select:

Open with Live Server
The dashboard will open in the browser.

Possible URLs:

http://127.0.0.1:5500/
or:

http://127.0.0.1:5500/dashboard/index.html

Export Options
The dashboard supports:

Export as CSV
Export as Excel
Exported files include:

CPU usage
RAM usage
GPU usage
Top CPU apps
Top RAM apps
GPU apps
Data updated time
Exported time
Screenshots
Add your screenshots here later.

Dashboard Screenshot
UiPath Workflow Screenshot
JSON Output Screenshot
CSV / Excel Export Screenshot
Common Issues
Values stay at 0
Check whether performance.json is being updated by UiPath.

JSON fetch failed
Make sure you are using Live Server. Do not open index.html directly with file://.

Correct fetch path:
fetch("./performance.json")
GPU apps not showing
GPU apps only appear when Windows reports active GPU engine usage. If no app is using GPU, the dashboard shows:

No active GPU apps found.

Future Enhancements
Add performance history charts
Store monitoring data in a database
Add CPU/RAM/GPU alert notifications
Add process search and filtering
Add multi-system monitoring
Add UiPath Orchestrator scheduling
Project Status
Completed:

UiPath backend monitoring
PowerShell performance collection
JSON generation
Live dashboard frontend
CPU/RAM/GPU monitoring
Top app usage tables
CSV and Excel export
Debug logging


