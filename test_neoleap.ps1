function Send-Packet {
    param($port, $msg)
    $payload = [byte[]]::new($msg.Length + 3)
    $payload[0] = 0x02
    $lrc = 0
    for ($i = 0; $i -lt $msg.Length; $i++) {
        $payload[$i + 1] = [byte][char]$msg[$i]
        $lrc = $lrc -bxor $payload[$i + 1]
    }
    $lrc = $lrc -bxor 0x03
    $payload[$payload.Length - 2] = 0x03
    $payload[$payload.Length - 1] = $lrc
    $port.Write($payload, 0, $payload.Length)
    Write-Host "-> Sent format '$msg' at $baud baud"
}

$bauds = @(115200, 9600)
$commands = @(
    "P000000000300",          # Format 1: Geidea Standard P
    "01000000000300",         # Format 2: SPAN2 Command 01
    "PUR000000000300",        # Format 3: STS/POSBank PUR
    "0100300",                # Format 4: Short len
    "PUR;000000000300",       # Format 5: Delimited
    "PAY000000000300"         # Format 6: Pay
)

Write-Host "Starting Neoleap Auto-Discovery Ping..."

foreach ($baud in $bauds) {
    try {
        Write-Host ""
        Write-Host "============================="
        Write-Host "  TESTING SPEED: $baud"
        Write-Host "============================="
        $port = New-Object System.IO.Ports.SerialPort COM3, $baud, None, 8, One
        $port.ReadTimeout = 1500
        $port.WriteTimeout = 1500
        $port.Open()

        foreach ($cmd in $commands) {
            Send-Packet $port $cmd
            
            # NeoLeap might need 2-3 seconds to light up its screen
            Start-Sleep -Seconds 3

            if ($port.BytesToRead -gt 0) {
                # Device responded! Wait briefly to gather full bytes
                Start-Sleep -Milliseconds 500 
                $len = $port.BytesToRead
                $buf = [byte[]]::new($len)
                $port.Read($buf, 0, $len) | Out-Null
                $resp = [System.Text.Encoding]::ASCII.GetString($buf)
                $respHex = [System.BitConverter]::ToString($buf)
                Write-Host "   +++ DEVICE RESPONDED +++ " -ForegroundColor Green
                Write-Host "   Ascii: $resp"
                Write-Host "   Hex: $respHex"
                Write-Host "   WE FOUND THE CORRECT PROTOCOL: $cmd at $baud!" -ForegroundColor Cyan
            }
        }
        $port.Close()
    } catch {
        Write-Host "Failed to open COM3 at $baud. Mada device might be disconnected or locked: $($_.Exception.Message)" -ForegroundColor Red
        if ($port -and $port.IsOpen) { $port.Close() }
    }
}
Write-Host "Discovery complete."
