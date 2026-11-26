param([int]$AttachProcessId = 0)

$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$translationScript = Join-Path $PSScriptRoot 'translate-tarkov-quests-offline.py'
$runStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logRoot = Join-Path $env:TEMP "tarkov-translation-monitor-$runStamp"
New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
$monitorLog = Join-Path $logRoot 'monitor.log'
$stdoutLog = Join-Path $logRoot 'translation.stdout.log'
$stderrLog = Join-Path $logRoot 'translation.stderr.log'
$cachePath = Join-Path $projectRoot 'resources\quests\quests.argos-cache.json'

function Write-MonitorLog([string]$message) {
    Add-Content -LiteralPath $monitorLog -Encoding utf8 -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $message"
}

function Write-ConnectionSnapshot([double]$totalMbps) {
    Write-MonitorLog "Network sample reached ${totalMbps}Mbps. Capturing active socket owners."
    $connections = foreach ($connection in (Get-NetTCPConnection -State Established -ErrorAction SilentlyContinue | Where-Object { $_.RemoteAddress -notin @('127.0.0.1', '::1') })) {
        $owner = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
        [PSCustomObject]@{
            Protocol = 'TCP'
            Process = $owner.ProcessName
            PID = $connection.OwningProcess
            RemoteAddress = $connection.RemoteAddress
            RemotePort = $connection.RemotePort
            LocalPort = $connection.LocalPort
            Path = $owner.Path
        }
    }
    $udpEndpoints = foreach ($endpoint in (Get-NetUDPEndpoint -ErrorAction SilentlyContinue)) {
        $owner = Get-Process -Id $endpoint.OwningProcess -ErrorAction SilentlyContinue
        [PSCustomObject]@{
            Protocol = 'UDP'
            Process = $owner.ProcessName
            PID = $endpoint.OwningProcess
            RemoteAddress = ''
            RemotePort = ''
            LocalPort = $endpoint.LocalPort
            Path = $owner.Path
        }
    }
    $snapshot = @($connections) + @($udpEndpoints)
    if ($snapshot.Count -gt 0) {
        $snapshot | Format-Table -AutoSize | Out-String -Width 300 | Add-Content -LiteralPath $monitorLog -Encoding utf8
    } else {
        Write-MonitorLog 'No TCP/UDP socket owners were visible during the sample.'
    }
}

$spikeThresholdMbps = 50.0
if ($AttachProcessId -gt 0) {
    $translationProcess = Get-Process -Id $AttachProcessId -ErrorAction Stop
    Write-MonitorLog "Attached to running translation. PID=$($translationProcess.Id); spike threshold=${spikeThresholdMbps}Mbps for 3 consecutive samples; logs=$logRoot"
} else {
    if (Test-Path -LiteralPath $cachePath) {
        Copy-Item -LiteralPath $cachePath -Destination (Join-Path $logRoot 'cache-before-run.json')
    }
    $python = (Get-Command python -ErrorAction Stop).Source
    $arguments = '"{0}"' -f $translationScript
    $translationProcess = Start-Process -FilePath $python -ArgumentList $arguments -WorkingDirectory $projectRoot -PassThru -NoNewWindow -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog
    Write-MonitorLog "Started offline translation. PID=$($translationProcess.Id); spike threshold=${spikeThresholdMbps}Mbps for 3 consecutive samples; logs=$logRoot"
}

$consecutiveHighSamples = 0
$highSampleCaptured = $false
$sampleNumber = 0

while ($true) {
    $translationProcess.Refresh()
    if ($translationProcess.HasExited) { break }
    Start-Sleep -Seconds 1
    try {
        $samples = (Get-Counter -Counter '\Network Interface(*)\Bytes Total/sec' -ErrorAction Stop).CounterSamples |
            Where-Object { $_.InstanceName -notmatch 'loopback|isatap|teredo|vmware|virtualbox|vethernet|bluetooth|wi-fi direct' }
        $totalMbps = [math]::Round((($samples | Measure-Object -Property CookedValue -Sum).Sum * 8) / 1000000, 2)
        $sampleNumber++
        if ($sampleNumber % 10 -eq 0) {
            Write-MonitorLog "Network total=${totalMbps}Mbps"
        }
        if ($totalMbps -gt $spikeThresholdMbps) {
            $consecutiveHighSamples++
            if (-not $highSampleCaptured) {
                Write-ConnectionSnapshot $totalMbps
                $highSampleCaptured = $true
            }
        } else {
            $consecutiveHighSamples = 0
            $highSampleCaptured = $false
        }

        if ($consecutiveHighSamples -ge 3) {
            Write-MonitorLog "SPIKE detected: total network traffic ${totalMbps}Mbps for 3 consecutive samples. Stopping translation."
            Stop-Process -Id $translationProcess.Id -Force -ErrorAction SilentlyContinue
            Write-MonitorLog 'Translation stopped on spike. Finished quest checkpoints remain saved; the in-progress quest may need to be repeated on resume.'
            break
        }
    } catch {
        Write-MonitorLog "Network monitor error: $($_.Exception.Message). Stopping translation because the requested monitoring is unavailable."
        Stop-Process -Id $translationProcess.Id -Force -ErrorAction SilentlyContinue
        break
    }
    $translationProcess.Refresh()
}

$translationProcess.Refresh()
if ($translationProcess.HasExited -and $consecutiveHighSamples -lt 3) {
    Write-MonitorLog "Translation process exited with code $($translationProcess.ExitCode)."
}
Write-MonitorLog "Run logs are in $logRoot"
