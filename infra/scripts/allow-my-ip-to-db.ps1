# Re-run this whenever MySQL Workbench can't reach the RDS instance —
# home/residential IPs are dynamic, so the previously-authorized IP can go stale.
# Finds and revokes any old rule this script added (matched by $ruleDescription,
# not by hardcoded CIDR), then authorizes the current public IP on port 3306.
# Leaves the Lambda security-group ingress rule (job-tracker-applications-lambda-sg)
# untouched — this only ever manages CidrIp-based rules with the description below.

$ErrorActionPreference = "Stop"

$sgName = "job-tracker-db-sg"
$port = 3306
$ruleDescription = "Workbench access (dynamic IP) - auto-managed by allow-my-ip-to-db.ps1"

$sgId = aws ec2 describe-security-groups --filters "Name=group-name,Values=$sgName" --query "SecurityGroups[0].GroupId" --output text
if (-not $sgId -or $sgId -eq "None") {
    throw "Could not find security group '$sgName'"
}

$currentIp = (Invoke-RestMethod -Uri "https://checkip.amazonaws.com").Trim()
$newCidr = "$currentIp/32"

Write-Host "Security group: $sgId"
Write-Host "Current public IP: $currentIp"

$existingJson = aws ec2 describe-security-groups --group-ids $sgId --query "SecurityGroups[0].IpPermissions" --output json
$existingPermissions = $existingJson | ConvertFrom-Json

$staleCidrs = @()
$alreadyAllowed = $false

foreach ($perm in $existingPermissions) {
    if ($perm.FromPort -ne $port) { continue }
    foreach ($range in $perm.IpRanges) {
        if ($range.Description -ne $ruleDescription) { continue }
        if ($range.CidrIp -eq $newCidr) {
            $alreadyAllowed = $true
        } else {
            $staleCidrs += $range.CidrIp
        }
    }
}

foreach ($cidr in $staleCidrs) {
    Write-Host "Revoking stale rule for $cidr"
    aws ec2 revoke-security-group-ingress --group-id $sgId --protocol tcp --port $port --cidr $cidr | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "revoke-security-group-ingress failed with exit code $LASTEXITCODE"
    }
}

if ($alreadyAllowed) {
    Write-Host "Current IP $newCidr is already allowed. Nothing to do."
} else {
    Write-Host "Authorizing $newCidr for port $port"

    # AWS CLI's --ip-permissions JSON-via-file:// loading is broken in this environment
    # (fails with "Expecting property name..." even on a verified-valid JSON file —
    # likely a Windows-specific file:// URI bug in this aws-cli build). The CLI's
    # shorthand syntax below avoids file loading entirely, and — unlike a raw JSON
    # string passed inline — uses single quotes for the description, so it never hits
    # the separate PowerShell-to-native-argv double-quote mangling bug either.
    $shorthand = "IpProtocol=tcp,FromPort=$port,ToPort=$port,IpRanges=[{CidrIp=$newCidr,Description='$ruleDescription'}]"

    aws ec2 authorize-security-group-ingress --group-id $sgId --ip-permissions $shorthand
    if ($LASTEXITCODE -ne 0) {
        throw "authorize-security-group-ingress failed with exit code $LASTEXITCODE"
    }
}

Write-Host "Done. MySQL Workbench can now connect from this machine."
