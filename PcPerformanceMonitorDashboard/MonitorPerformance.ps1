$ErrorActionPreference = "SilentlyContinue"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$dashboardFolder = Join-Path $projectRoot "dashboard"
$jsonPath = Join-Path $dashboardFolder "performance.json"
$logFolder = Join-Path $projectRoot "logs"
$logPath = Join-Path $logFolder "monitor.log"

New-Item -ItemType Directory -Force -Path $dashboardFolder | Out-Null
New-Item -ItemType Directory -Force -Path $logFolder | Out-Null

function Limit-Percent($value) {
    if ($null -eq $value) { return 0 }

    $number = 0.0
    if (-not [double]::TryParse($value.ToString(), [ref]$number)) { return 0 }
    if ($number -lt 0) { return 0 }
    if ($number -gt 100) { return 100 }

    return [math]::Round($number, 1)
}

function Get-TopCpuApps {
    $cpuCounters = @((Get-Counter '\Process(*)\% Processor Time').CounterSamples |
        Where-Object {
            $_.InstanceName -and
            $_.InstanceName -notmatch '^(_total|idle)$' -and
            $_.CookedValue -gt 0
        })

    $logicalProcessors = [Environment]::ProcessorCount
    if ($logicalProcessors -lt 1) { $logicalProcessors = 1 }

    $apps = @($cpuCounters |
        Group-Object InstanceName |
        ForEach-Object {
            $usage = (($_.Group | Measure-Object -Property CookedValue -Sum).Sum / $logicalProcessors)
            [pscustomobject]@{
                name = $_.Name
                cpu = [math]::Round($usage, 1)
            }
        } |
        Where-Object { $_.cpu -gt 0 } |
        Sort-Object cpu -Descending |
        Select-Object -First 3)

    if ($apps.Count -eq 0) {
        $apps = @(Get-Process |
            Where-Object { $_.CPU -ne $null } |
            Sort-Object CPU -Descending |
            Select-Object -First 3 |
            ForEach-Object {
                [pscustomobject]@{
                    name = $_.ProcessName
                    cpu = [math]::Round([double]$_.CPU, 1)
                }
            })
    }

    return @($apps)
}

function Get-TopRamApps {
    return @(Get-Process |
        Where-Object { $_.WorkingSet64 -gt 0 } |
        Sort-Object WorkingSet64 -Descending |
        Select-Object -First 3 |
        ForEach-Object {
            [pscustomobject]@{
                name = $_.ProcessName
                memoryMb = [math]::Round($_.WorkingSet64 / 1MB, 1)
            }
        })
}

function Get-GpuData {
    $gpuCounter = Get-Counter '\GPU Engine(*)\Utilization Percentage'
    $samples = @($gpuCounter.CounterSamples)
    $totalGpu = Limit-Percent (($samples | Measure-Object -Property CookedValue -Sum).Sum)

    $processById = @{}
    Get-Process | ForEach-Object {
        $processById[[int]$_.Id] = $_.ProcessName
    }

    function Get-GpuEngineName($path) {
        if ($path -match "engtype_([^\\\)]+)") {
            return $Matches[1].ToUpper()
        }

        return "GPU"
    }

    $apps = @($samples |
        Where-Object { $_.CookedValue -gt 0.1 -and $_.Path -match "pid_([0-9]+)" } |
        ForEach-Object {
            $pidNumber = [int]$Matches[1]
            $name = "PID $pidNumber"
            if ($processById.ContainsKey($pidNumber)) {
                $name = $processById[$pidNumber]
            }

            [pscustomobject]@{
                name = $name
                engine = Get-GpuEngineName $_.Path
                gpu = [math]::Round([double]$_.CookedValue, 1)
            }
        } |
        Group-Object name, engine |
        ForEach-Object {
            $first = $_.Group[0]
            [pscustomobject]@{
                name = $first.name
                engine = $first.engine
                gpu = [math]::Round(($_.Group | Measure-Object -Property gpu -Sum).Sum, 1)
            }
        } |
        Sort-Object gpu -Descending |
        Select-Object -First 3)

    return [pscustomobject]@{
        total = $totalGpu
        apps = @($apps)
    }
}

$cpu = Limit-Percent ((Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples.CookedValue)
$ram = Limit-Percent ((Get-Counter '\Memory\% Committed Bytes In Use').CounterSamples.CookedValue)
$gpuData = Get-GpuData

$payload = [pscustomobject]@{
    cpu = $cpu
    ram = $ram
    gpu = $gpuData.total
    topCpuApps = @(Get-TopCpuApps)
    topRamApps = @(Get-TopRamApps)
    gpuApps = @($gpuData.apps | ForEach-Object { $_ })
    updatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

$json = $payload | ConvertTo-Json -Depth 6
$tempPath = "$jsonPath.tmp"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText($tempPath, $json, $utf8NoBom)
Move-Item -Path $tempPath -Destination $jsonPath -Force
Add-Content -Path $logPath -Value "Updated $jsonPath at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

$json
