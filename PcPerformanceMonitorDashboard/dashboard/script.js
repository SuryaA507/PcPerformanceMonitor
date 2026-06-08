const DATA_URL = "./performance.json";
const REFRESH_MS = 3000;
const MAX_DEBUG_LINES = 12;

const elements = {
    cpuText: document.getElementById("cpuText"),
    ramText: document.getElementById("ramText"),
    gpuText: document.getElementById("gpuText"),
    cpuBar: document.getElementById("cpuBar"),
    ramBar: document.getElementById("ramBar"),
    gpuBar: document.getElementById("gpuBar"),
    cpuHint: document.getElementById("cpuHint"),
    ramHint: document.getElementById("ramHint"),
    gpuHint: document.getElementById("gpuHint"),
    topCpuTable: document.getElementById("topCpuTable"),
    topRamTable: document.getElementById("topRamTable"),
    gpuAppsTable: document.getElementById("gpuAppsTable"),
    cpuAppCount: document.getElementById("cpuAppCount"),
    ramAppCount: document.getElementById("ramAppCount"),
    gpuAppCount: document.getElementById("gpuAppCount"),
    connectionDot: document.getElementById("connectionDot"),
    connectionText: document.getElementById("connectionText"),
    lastUpdated: document.getElementById("lastUpdated"),
    debugLog: document.getElementById("debugLog"),
    refreshButton: document.getElementById("refreshButton"),
    exportCsvButton: document.getElementById("exportCsvButton"),
    exportExcelButton: document.getElementById("exportExcelButton")
};

const debugLines = [];
let latestData = null;

function addDebug(message, payload) {
    const time = new Date().toLocaleTimeString();
    const line = `[${time}] ${message}`;

    debugLines.unshift(line);
    if (debugLines.length > MAX_DEBUG_LINES) {
        debugLines.pop();
    }

    elements.debugLog.textContent = debugLines.join("\n");

    if (payload !== undefined) {
        console.log(line, payload);
    } else {
        console.log(line);
    }
}

function clampPercent(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.min(100, Math.max(0, number));
}

function formatPercent(value) {
    return `${clampPercent(value).toFixed(1)}%`;
}

function setConnection(isOnline, message) {
    elements.connectionDot.classList.toggle("online", isOnline);
    elements.connectionText.textContent = message;
}

function getFetchHelp(error) {
    const pageUrl = window.location.href;

    if (window.location.protocol === "file:") {
        return `Page is opened as file://. Use VS Code Live Server, then open http://127.0.0.1:5500/dashboard/index.html`;
    }

    if (error instanceof SyntaxError) {
        return "performance.json was found, but it is not valid JSON. UiPath may be writing the file while the browser is reading it.";
    }

    return `Current page: ${pageUrl}. Make sure performance.json is in the same dashboard folder.`;
}

function updateMetric(textElement, barElement, hintElement, value, hintText) {
    const percent = clampPercent(value);
    textElement.textContent = formatPercent(percent);
    barElement.style.width = `${percent}%`;
    hintElement.textContent = hintText;
}

function normalizeList(list) {
    if (Array.isArray(list)) {
        return list;
    }

    if (list && typeof list === "object") {
        return [list];
    }

    return [];
}

function getDashboardLists(data) {
    const topCpuApps = normalizeList(data.topCpuApps).length > 0
        ? normalizeList(data.topCpuApps)
        : normalizeList(data.topApps);
    const topRamApps = normalizeList(data.topRamApps);
    const gpuApps = normalizeList(data.gpuApps).length > 0
        ? normalizeList(data.gpuApps)
        : normalizeList(data.topGpuApps);

    return {
        topCpuApps,
        topRamApps,
        gpuApps
    };
}

function renderSimpleTable(tbody, items, valueKey, emptyText) {
    const rows = normalizeList(items);

    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2">${emptyText}</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map((item) => {
        const name = escapeHtml(item.name || item.ProcessName || "Unknown");
        const rawValue = item[valueKey] ?? item.cpu ?? item.CPU ?? item.ram ?? item.memoryMb ?? item.RAM_MB ?? 0;
        const value = rawValue === null || rawValue === undefined || rawValue === "" ? "0" : rawValue;

        return `
            <tr>
                <td class="app-name">${name}</td>
                <td><span class="usage-pill">${escapeHtml(String(value))}${valueKey === "memoryMb" ? " MB" : "%"}</span></td>
            </tr>
        `;
    }).join("");
}

function renderGpuTable(items) {
    const rows = normalizeList(items);

    if (rows.length === 0) {
        elements.gpuAppsTable.innerHTML = '<tr><td colspan="3">No active GPU apps found.</td></tr>';
        return;
    }

    elements.gpuAppsTable.innerHTML = rows.map((item) => {
        const name = escapeHtml(item.name || item.ProcessName || "Unknown");
        const engine = escapeHtml(item.engine || "GPU Engine");
        const usage = formatPercent(item.gpu ?? item.GPU ?? item.usage ?? 0);

        return `
            <tr>
                <td class="app-name">${name}</td>
                <td>${engine}</td>
                <td><span class="usage-pill">${usage}</span></td>
            </tr>
        `;
    }).join("");
}

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function updateDashboard(data) {
    const cpu = clampPercent(data.cpu);
    const ram = clampPercent(data.ram);
    const gpu = clampPercent(data.gpu);
    const { topCpuApps, topRamApps, gpuApps } = getDashboardLists(data);

    updateMetric(elements.cpuText, elements.cpuBar, elements.cpuHint, cpu, "Total processor usage");
    updateMetric(elements.ramText, elements.ramBar, elements.ramHint, ram, "Committed memory in use");
    updateMetric(elements.gpuText, elements.gpuBar, elements.gpuHint, gpu, "Total GPU engine utilization");

    renderSimpleTable(elements.topCpuTable, topCpuApps, "cpu", "No CPU process data found.");
    renderSimpleTable(elements.topRamTable, topRamApps, "memoryMb", "No RAM process data found.");
    renderGpuTable(gpuApps);

    elements.cpuAppCount.textContent = `${topCpuApps.length} found`;
    elements.ramAppCount.textContent = `${topRamApps.length} found`;
    elements.gpuAppCount.textContent = `${gpuApps.length} found`;
    elements.lastUpdated.textContent = `Last update: ${data.updatedAt || new Date().toLocaleTimeString()}`;

    latestData = data;
    setExportButtonsEnabled(true);
    setConnection(true, "Live data connected");
}

function setExportButtonsEnabled(isEnabled) {
    elements.exportCsvButton.disabled = !isEnabled;
    elements.exportExcelButton.disabled = !isEnabled;
}

function normalizeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Number(number.toFixed(2)) : 0;
}

function getCurrentTimestamp() {
    return new Date().toLocaleString();
}

function buildExportRows(data, exportedAt = getCurrentTimestamp()) {
    const { topCpuApps, topRamApps, gpuApps } = getDashboardLists(data);
    const rows = [
        {
            section: "Summary",
            application: "Total CPU Usage",
            metric: "CPU",
            value: normalizeNumber(data.cpu),
            unit: "%",
            engine: "",
            updatedAt: data.updatedAt || "",
            exportedAt
        },
        {
            section: "Summary",
            application: "Total RAM Usage",
            metric: "RAM",
            value: normalizeNumber(data.ram),
            unit: "%",
            engine: "",
            updatedAt: data.updatedAt || "",
            exportedAt
        },
        {
            section: "Summary",
            application: "Total GPU Usage",
            metric: "GPU",
            value: normalizeNumber(data.gpu),
            unit: "%",
            engine: "",
            updatedAt: data.updatedAt || "",
            exportedAt
        }
    ];

    topCpuApps.forEach((app) => {
        rows.push({
            section: "Top CPU Apps",
            application: app.name || app.ProcessName || "Unknown",
            metric: "CPU",
            value: normalizeNumber(app.cpu ?? app.CPU),
            unit: "%",
            engine: "",
            updatedAt: data.updatedAt || "",
            exportedAt
        });
    });

    topRamApps.forEach((app) => {
        rows.push({
            section: "Top RAM Apps",
            application: app.name || app.ProcessName || "Unknown",
            metric: "RAM",
            value: normalizeNumber(app.memoryMb ?? app.RAM_MB),
            unit: "MB",
            engine: "",
            updatedAt: data.updatedAt || "",
            exportedAt
        });
    });

    gpuApps.forEach((app) => {
        rows.push({
            section: "Apps Using GPU",
            application: app.name || app.ProcessName || "Unknown",
            metric: "GPU",
            value: normalizeNumber(app.gpu ?? app.GPU ?? app.usage),
            unit: "%",
            engine: app.engine || "GPU Engine",
            updatedAt: data.updatedAt || "",
            exportedAt
        });
    });

    if (gpuApps.length === 0) {
        rows.push({
            section: "Apps Using GPU",
            application: "No active GPU apps found",
            metric: "GPU",
            value: 0,
            unit: "%",
            engine: "",
            updatedAt: data.updatedAt || "",
            exportedAt
        });
    }

    return rows;
}

function getExportFileName(extension) {
    const stamp = new Date()
        .toISOString()
        .replaceAll(":", "-")
        .replace(/\.\d{3}Z$/, "");

    return `pc-performance-${stamp}.${extension}`;
}

function downloadBlob(content, mimeType, fileName) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function csvEscape(value) {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
}

function exportCsv() {
    if (!latestData) {
        addDebug("Export skipped: no live data loaded yet.");
        return;
    }

    const exportedAt = getCurrentTimestamp();
    const headers = ["Section", "Application", "Metric", "Value", "Unit", "GPU Engine", "Data Updated At", "Exported At"];
    const rows = buildExportRows(latestData, exportedAt);
    const csv = [
        headers.map(csvEscape).join(","),
        ...rows.map((row) => [
            row.section,
            row.application,
            row.metric,
            row.value,
            row.unit,
            row.engine,
            row.updatedAt,
            row.exportedAt
        ].map(csvEscape).join(","))
    ].join("\n");

    downloadBlob(csv, "text/csv;charset=utf-8", getExportFileName("csv"));
    addDebug(`CSV export downloaded with ${rows.length} rows at ${exportedAt}.`);
}

function exportExcel() {
    if (!latestData) {
        addDebug("Export skipped: no live data loaded yet.");
        return;
    }

    const exportedAt = getCurrentTimestamp();
    const rows = buildExportRows(latestData, exportedAt);
    const headerCells = ["Section", "Application", "Metric", "Value", "Unit", "GPU Engine", "Data Updated At", "Exported At"];
    const tableRows = rows.map((row) => `
        <tr>
            <td>${escapeHtml(row.section)}</td>
            <td>${escapeHtml(row.application)}</td>
            <td>${escapeHtml(row.metric)}</td>
            <td>${escapeHtml(String(row.value))}</td>
            <td>${escapeHtml(row.unit)}</td>
            <td>${escapeHtml(row.engine)}</td>
            <td>${escapeHtml(row.updatedAt)}</td>
            <td>${escapeHtml(row.exportedAt)}</td>
        </tr>
    `).join("");
    const html = `
        <html>
            <head>
                <meta charset="UTF-8">
            </head>
            <body>
                <table>
                    <thead>
                        <tr>${headerCells.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </body>
        </html>
    `;

    downloadBlob(html, "application/vnd.ms-excel;charset=utf-8", getExportFileName("xls"));
    addDebug(`Excel export downloaded with ${rows.length} rows at ${exportedAt}.`);
}

async function loadPerformanceData() {
    const url = `${DATA_URL}?cacheBust=${Date.now()}`;
    addDebug(`Fetching ${DATA_URL}`);
    addDebug(`Page URL: ${window.location.href}`);

    try {
        const response = await fetch(url, {
            method: "GET",
            cache: "no-store",
            headers: {
                "Accept": "application/json"
            }
        });

        addDebug(`Fetch response: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            throw new Error(`Could not load ${DATA_URL}. HTTP ${response.status}`);
        }

        const data = await response.json();
        addDebug("JSON parsed successfully", data);
        updateDashboard(data);
    } catch (error) {
        setConnection(false, "JSON fetch failed");
        elements.lastUpdated.textContent = "Last update: --";
        addDebug(`ERROR: ${error.message}`);
        addDebug(getFetchHelp(error));
        console.error("Performance dashboard fetch error:", error);
    }
}

elements.refreshButton.addEventListener("click", loadPerformanceData);
elements.exportCsvButton.addEventListener("click", exportCsv);
elements.exportExcelButton.addEventListener("click", exportExcel);

setExportButtonsEnabled(false);
addDebug("Dashboard initialized");
addDebug(`Auto-refresh interval: ${REFRESH_MS / 1000}s`);
loadPerformanceData();
setInterval(loadPerformanceData, REFRESH_MS);
