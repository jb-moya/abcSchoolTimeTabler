param (
    [string]$suffix = "_$(Get-Date -Format 'yyMMddHHmmss')$(Get-Date -Format 'fff')"
)

# Build the project with the specified suffix
& make -j SUFFIX=$suffix

# Run the project with the specified suffix
& make run SUFFIX=$suffix
