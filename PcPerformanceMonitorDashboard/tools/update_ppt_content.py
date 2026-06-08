from copy import deepcopy
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Meeting_Summarizer_PraveenS(AIML) - sample.pptx"
OUTPUT = ROOT / "PC_Performance_Monitor_Bot_Presentation.pptx"

P_NS = "http://schemas.openxmlformats.org/presentationml/2006/main"
A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

ET.register_namespace("p", P_NS)
ET.register_namespace("a", A_NS)
ET.register_namespace("r", R_NS)

P = f"{{{P_NS}}}"
A = f"{{{A_NS}}}"


SLIDE_TEXT = {
    1: [
        "3rd year B.Tech Artificial Intelligence and Data Science\nK.S.RANGASAMY COLLEGE OF TECHNOLOGY\n(Autonomous)\nTiruchengode - 637 215, Namakkal Dt. Tamil Nadu",
        "PC Performance Monitor Bot Automation",
        "ROBOTIC PROCESS AUTOMATION",
        "ATHITYAA A",
    ],
    2: [
        "INTRODUCTION",
        "Monitoring PC performance is important for understanding system health and application resource usage.\nManual checking through Task Manager is useful, but it does not provide a customized RPA dashboard or exportable report.\nThe PC Performance Monitor Bot automates system monitoring using UiPath and PowerShell.\nIt collects CPU, RAM, GPU, top CPU applications, top RAM applications, and GPU-using applications.\nThe collected values are written into performance.json and shown in a live HTML dashboard.\nThe dashboard refreshes automatically every few seconds and provides CSV and Excel export options.",
    ],
    3: [
        "ABSTRACT",
        "The PC Performance Monitor Bot is an RPA-based automation project that tracks live computer performance and displays the data in a browser dashboard.\nUiPath runs the backend workflow and invokes PowerShell commands to read Windows performance counters.\nThe bot generates a JSON file containing CPU usage, RAM usage, GPU usage, and top application-level usage details.\nThe frontend dashboard, developed using HTML, CSS, and JavaScript, fetches the JSON file every three seconds.\nThe system provides a modern dark UI with progress bars, tables, debug logs, and export options for CSV and Excel.\nThis project demonstrates a simple and practical method of connecting UiPath automation with a real-time web dashboard.",
    ],
    4: [
        "KEY FEATURES AND BENEFITS",
        "Key Features\nMonitors total CPU, RAM, and GPU usage in real time.\nDisplays top CPU-consuming and RAM-consuming applications.\nShows applications currently using GPU resources.\nUses JSON file communication between UiPath and the dashboard.\nRefreshes automatically every three seconds.\nExports data to CSV and Excel-compatible files.\n\nBenefits\nReduces manual checking of Task Manager.\nProvides a clear visual dashboard for system performance.\nHelps identify resource-heavy applications quickly.\nUses a beginner-friendly architecture without a database.",
    ],
    5: [
        "REAL WORLD APPLICATION AND USE CASES OF RPA",
        "Student Lab Monitoring - Helps students observe how applications consume CPU, RAM, and GPU.\nIT Support - Allows support teams to identify high-resource applications quickly.\nGaming and Graphics Systems - Shows GPU usage while games or rendering tools are running.\nAutomation Testing - Helps monitor system load while UiPath bots are executing.\nTraining and Demonstration - Explains how RPA collects operating system data for dashboards.\nSmall Office Monitoring - Provides a lightweight local dashboard without a full monitoring platform.",
    ],
    6: [
        "TOOLS USED",
        "UiPath Studio - Used to create and run the backend monitoring workflow.\nInvoke PowerShell Activity - Collects CPU, RAM, GPU, and process usage data.\nPowerShell - Reads Windows performance counters and generates JSON output.\nHTML - Builds the dashboard structure.\nCSS - Provides the dark UI, progress bars, and table styling.\nJavaScript - Fetches performance.json, updates the dashboard, and exports data.\nJSON File - Acts as the communication bridge between UiPath and the dashboard.\nVS Code Live Server - Serves the dashboard files through localhost.",
    ],
    7: [
        "WORK FLOW",
    ],
    8: [
        "WORK FLOW",
    ],
    9: [
        "INPUT",
        "Windows counters and JSON data:",
    ],
    10: [
        "OUTPUT",
    ],
    11: [
        "OUTPUT",
    ],
    12: [
        "Open UiPath Studio and run Main.xaml.\nInvoke PowerShell to collect CPU, RAM, GPU, and process data.\nConvert the collected values into structured JSON.\nWrite JSON safely to dashboard/performance.json.\nOpen the dashboard using VS Code Live Server.\nFetch performance.json every three seconds.\nUpdate progress bars and application tables dynamically.\nShow fallback messages when no GPU apps are active.\nExport dashboard data as CSV or Excel.",
        "PROCESS",
    ],
    13: [
        "CONCLUSION",
        "The PC Performance Monitor Bot automates the process of collecting and displaying live system performance data. By combining UiPath, PowerShell, JSON, and a browser dashboard, the project provides a simple monitoring solution similar to a lightweight Task Manager. It displays CPU, RAM, GPU, top application usage, and active GPU process details in real time. Debug logs and export options make it useful for learning and local monitoring.",
    ],
    14: [
        "Thank You !",
        "PC Performance Monitor Bot connects RPA with a live dashboard.\nThank you for your attention.",
        "/ksrct1994",
        "www.ksrct.ac.in",
    ],
}


def sorted_slide_names(names):
    return sorted(
        [n for n in names if n.startswith("ppt/slides/slide") and n.endswith(".xml")],
        key=lambda n: int(Path(n).stem.replace("slide", "")),
    )


def text_bodies(root):
    return root.findall(f".//{P}txBody")


def first_run_props(tx_body):
    r_pr = tx_body.find(f".//{A}rPr")
    return deepcopy(r_pr) if r_pr is not None else None


def replace_text_body(tx_body, text):
    body_pr = tx_body.find(f"{A}bodyPr")
    lst_style = tx_body.find(f"{A}lstStyle")
    r_pr = first_run_props(tx_body)

    for child in list(tx_body):
        tx_body.remove(child)

    if body_pr is not None:
        tx_body.append(body_pr)
    if lst_style is not None:
        tx_body.append(lst_style)

    lines = text.split("\n")
    for line in lines:
        p = ET.SubElement(tx_body, f"{A}p")
        r = ET.SubElement(p, f"{A}r")
        if r_pr is not None:
            r.append(deepcopy(r_pr))
        t = ET.SubElement(r, f"{A}t")
        t.text = line
        ET.SubElement(p, f"{A}endParaRPr")


def update_deck():
    with ZipFile(SOURCE, "r") as zin, ZipFile(OUTPUT, "w", ZIP_DEFLATED) as zout:
        slide_names = sorted_slide_names(zin.namelist())
        slide_name_to_index = {name: idx + 1 for idx, name in enumerate(slide_names)}

        for item in zin.infolist():
            data = zin.read(item.filename)

            if item.filename in slide_name_to_index:
                slide_index = slide_name_to_index[item.filename]
                replacements = SLIDE_TEXT.get(slide_index, [])
                root = ET.fromstring(data)
                bodies = [body for body in text_bodies(root) if "".join(t.text or "" for t in body.iter(f"{A}t")).strip()]

                for body, new_text in zip(bodies, replacements):
                    replace_text_body(body, new_text)

                data = ET.tostring(root, encoding="utf-8", xml_declaration=True)

            zout.writestr(item, data)

    print(OUTPUT)


if __name__ == "__main__":
    update_deck()
