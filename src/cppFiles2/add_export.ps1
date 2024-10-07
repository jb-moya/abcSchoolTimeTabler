# Define the file path
$file_path = "abc2.js"

# Read all lines from the file
$lines = Get-Content $file_path

$lines = $lines[0..($lines.Count - 5)]

# Append 'export default Module'
$lines += 'export default Module;'

# Write the modified content back to the file
Set-Content -Path $file_path -Value $lines

Write-Host "Last three lines deleted and 'export default Module' added to the end."
