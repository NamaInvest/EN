$key = "C:\Users\1\.ssh\hetzner_key"
$ip = "root@46.4.188.170"
$scp = "C:\Windows\System32\OpenSSH\scp.exe"
$ssh = "C:\Windows\System32\OpenSSH\ssh.exe"

Write-Host "Uploading Deploy Script to Host..."
& $scp -o StrictHostKeyChecking=no -i $key "deploy_n2_n10.sh" "${ip}:/root/deploy_n2_n10.sh"

Write-Host "Executing Deployment across N2-N10 in the background..."
& $ssh -o StrictHostKeyChecking=no -i $key $ip "chmod +x /root/deploy_n2_n10.sh && /root/deploy_n2_n10.sh"

Write-Host "Deployment Master Script executed."
