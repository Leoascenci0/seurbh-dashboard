# ============================================================
#  SEURBH — Servidor Local com API REST para Drive Storage
#  Porta: 8001  |  Frontend: ./dist/
# ============================================================

$port   = 8002
$config = "$PSScriptRoot\config.json"

# Lógica condicional: Modo Produção (Casa) vs Modo Dev (Trabalho)
$distPath = Join-Path $PSScriptRoot "dist"
if (Test-Path $distPath -PathType Container) {
    $root = $distPath
    Write-Host "Modo Produção Detectado (Pasta 'dist' encontrada)" -ForegroundColor Magenta
} else {
    $root = $PSScriptRoot
    Write-Host "Modo Desenvolvimento Detectado (Pasta 'dist' ausente, servindo index-dev.html)" -ForegroundColor Magenta
}

# Pasta raiz padrão (pode ser alterada pela interface)
$defaultRootFolder = "G:\Meu Drive"

function Get-Config {
    if (Test-Path $config) {
        try { return Get-Content $config -Raw | ConvertFrom-Json }
        catch {}
    }
    return [PSCustomObject]@{ rootFolder = $defaultRootFolder }
}

function Save-Config($obj) {
    if (-not (Test-Path (Split-Path $config))) {
        New-Item -ItemType Directory -Force -Path (Split-Path $config) | Out-Null
    }
    $obj | ConvertTo-Json | Set-Content $config -Encoding UTF8
}

function Get-MimeType($ext) {
    switch ($ext.ToLower()) {
        ".html"  { "text/html; charset=utf-8" }
        ".js"    { "application/javascript" }
        ".css"   { "text/css" }
        ".json"  { "application/json; charset=utf-8" }
        ".png"   { "image/png" }
        ".jpg"   { "image/jpeg" }
        ".jpeg"  { "image/jpeg" }
        ".svg"   { "image/svg+xml" }
        ".ico"   { "image/x-icon" }
        ".pdf"   { "application/pdf" }
        ".woff2" { "font/woff2" }
        default  { "application/octet-stream" }
    }
}

function Send-Json($response, $obj, $status = 200) {
    $json = $obj | ConvertTo-Json -Depth 10
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $response.StatusCode = $status
    $response.ContentType = "application/json; charset=utf-8"
    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
    $response.Close()
}

function Send-Error($response, $msg, $status = 400) {
    Send-Json $response @{ error = $msg } $status
}

function Handle-GetFolders($response, $cfg) {
    $rootDir = $cfg.rootFolder
    if (-not (Test-Path $rootDir)) {
        Send-Error $response "Pasta raiz não encontrada: $rootDir" 404
        return
    }
    $folders = Get-ChildItem -Path $rootDir -Directory -ErrorAction SilentlyContinue |
        Sort-Object Name |
        ForEach-Object {
            $count = (Get-ChildItem -Path $_.FullName -File -ErrorAction SilentlyContinue | Measure-Object).Count
            $subfolders = (Get-ChildItem -Path $_.FullName -Directory -ErrorAction SilentlyContinue | Measure-Object).Count
            @{
                name       = $_.Name
                path       = $_.FullName
                fileCount  = $count
                subfolders = $subfolders
            }
        }
    Send-Json $response @{ folders = $folders; root = $rootDir }
}

function Handle-GetSubFolders($response, $cfg, $folderPath) {
    if (-not $folderPath -or -not (Test-Path $folderPath)) {
        Send-Error $response "Pasta não encontrada" 404; return
    }
    $subs = Get-ChildItem -Path $folderPath -Directory -ErrorAction SilentlyContinue |
        Sort-Object Name |
        ForEach-Object {
            $count = (Get-ChildItem -Path $_.FullName -File -ErrorAction SilentlyContinue | Measure-Object).Count
            @{ name = $_.Name; path = $_.FullName; fileCount = $count }
        }
    Send-Json $response @{ subfolders = $subs }
}

function Handle-GetFiles($response, $folderPath) {
    if (-not $folderPath -or -not (Test-Path $folderPath)) {
        Send-Error $response "Pasta não encontrada" 404; return
    }
    # Google Drive native files (.gdoc, .gsheet, etc.) are virtual shortcuts with size 0
    $googleExts = @('.gdoc','.gsheet','.gslides','.gform','.gdraw','.gtable','.glink')
    $files = Get-ChildItem -Path $folderPath -File -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        ForEach-Object {
            $ext = $_.Extension.ToLower()
            $isGoogleFile = ($googleExts -contains $ext)
            # For Google native files, try to extract the online URL from the shortcut content
            $driveUrl = $null
            if ($isGoogleFile -and $_.Length -gt 0) {
                try {
                    $jsonContent = Get-Content -Path $_.FullName -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
                    $driveUrl = $jsonContent.url
                } catch {}
            }
            @{
                name         = $_.Name
                path         = $_.FullName
                size         = $_.Length
                extension    = $ext
                lastModified = $_.LastWriteTime.ToString("yyyy-MM-ddTHH:mm:ss")
                isGoogleFile = $isGoogleFile
                driveUrl     = $driveUrl
            }
        }
    Send-Json $response @{ files = $files; folder = $folderPath }
}

function Handle-Upload($request, $response, $query) {
    $destFolder = $query["folder"]
    if (-not $destFolder -or -not (Test-Path $destFolder)) {
        Send-Error $response "Pasta de destino inválida" 400; return
    }

    # Read multipart body
    $contentType = $request.ContentType
    if (-not $contentType -or -not $contentType.Contains("multipart/form-data")) {
        Send-Error $response "Requisição deve ser multipart/form-data" 400; return
    }

    # Extract boundary
    $boundary = ($contentType -split "boundary=")[1].Trim()
    $boundaryBytes  = [System.Text.Encoding]::UTF8.GetBytes("--$boundary")
    $boundaryEndBytes = [System.Text.Encoding]::UTF8.GetBytes("--$boundary--")

    # Read full body
    $bodyStream = New-Object System.IO.MemoryStream
    $request.InputStream.CopyTo($bodyStream)
    $bodyBytes = $bodyStream.ToArray()

    # Find Content-Disposition header to get filename
    $bodyText = [System.Text.Encoding]::UTF8.GetString($bodyBytes)
    $filenameMatch = [regex]::Match($bodyText, 'filename="([^"]+)"')
    if (-not $filenameMatch.Success) {
        Send-Error $response "Nome do arquivo não encontrado" 400; return
    }
    $filename = $filenameMatch.Groups[1].Value
    $filename = [System.IO.Path]::GetFileName($filename)  # security: strip path

    # Find where the actual file data starts (after double CRLF after headers)
    $headerEnd = $bodyText.IndexOf("`r`n`r`n")
    if ($headerEnd -lt 0) { $headerEnd = $bodyText.IndexOf("`n`n") + 1 }
    $dataStart = $headerEnd + 4  # skip \r\n\r\n

    # Find where the file data ends (before the closing boundary)
    $closingBoundary = "`r`n--$boundary"
    $closingBytes = [System.Text.Encoding]::UTF8.GetBytes($closingBoundary)

    # Find closing boundary in bytes
    $dataEnd = $bodyBytes.Length
    for ($i = $dataStart; $i -le $bodyBytes.Length - $closingBytes.Length; $i++) {
        $match = $true
        for ($j = 0; $j -lt $closingBytes.Length; $j++) {
            if ($bodyBytes[$i + $j] -ne $closingBytes[$j]) { $match = $false; break }
        }
        if ($match) { $dataEnd = $i; break }
    }

    $fileBytes = $bodyBytes[$dataStart..($dataEnd - 1)]

    # Save file
    $destPath = Join-Path $destFolder $filename
    # Avoid overwrite: add suffix if exists
    $counter = 1
    $base = [System.IO.Path]::GetFileNameWithoutExtension($filename)
    $ext  = [System.IO.Path]::GetExtension($filename)
    while (Test-Path $destPath) {
        $destPath = Join-Path $destFolder "${base}_${counter}${ext}"
        $counter++
    }

    [System.IO.File]::WriteAllBytes($destPath, $fileBytes)

    Send-Json $response @{
        success  = $true
        filename = [System.IO.Path]::GetFileName($destPath)
        path     = $destPath
        size     = $fileBytes.Length
    }
}

function Handle-GetConfig($response, $cfg) {
    Send-Json $response @{ rootFolder = $cfg.rootFolder }
}

function Handle-SaveConfig($request, $response) {
    $body = New-Object System.IO.StreamReader($request.InputStream)
    $json = $body.ReadToEnd()
    try {
        $obj = $json | ConvertFrom-Json
        if (-not $obj.rootFolder) { Send-Error $response "rootFolder obrigatório" 400; return }
        if (-not (Test-Path $obj.rootFolder)) {
            Send-Error $response "Caminho não existe: $($obj.rootFolder)" 404; return
        }
        Save-Config $obj
        Send-Json $response @{ success = $true; rootFolder = $obj.rootFolder }
    } catch {
        Send-Error $response "JSON inválido" 400
    }
}

function Parse-QueryString($rawUrl) {
    $qs = @{}
    $questionMark = $rawUrl.IndexOf('?')
    if ($questionMark -lt 0) { return $qs }
    $raw = $rawUrl.Substring($questionMark + 1)
    $raw -split '&' | ForEach-Object {
        $parts = $_ -split '=', 2
        if ($parts.Length -eq 2) {
            $key   = [System.Net.WebUtility]::UrlDecode($parts[0])
            $value = [System.Net.WebUtility]::UrlDecode($parts[1])
            $qs[$key] = $value
        }
    }
    return $qs
}

# ---- Start Server ----
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Cyan
Write-Host "   SEURBH - Interface de Armazenamento" -ForegroundColor White
Write-Host "   http://localhost:$port/" -ForegroundColor Green
Write-Host "   Ctrl+C para encerrar" -ForegroundColor Yellow
Write-Host "  ==========================================" -ForegroundColor Cyan
Write-Host ""

try {
    while ($listener.IsListening) {
        $context  = $listener.GetContext()
        $request  = $context.Request
        $response = $context.Response
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")

        $method = $request.HttpMethod
        $url    = $request.Url
        $path   = $url.LocalPath
        $query  = Parse-QueryString $request.RawUrl
        $cfg    = Get-Config

        Write-Host "$method $path" -ForegroundColor DarkGray

        # OPTIONS preflight
        if ($method -eq "OPTIONS") { $response.StatusCode = 204; $response.Close(); continue }

        # ---- API Routes ----
        if ($path -eq "/api/folders" -and $method -eq "GET") {
            Handle-GetFolders $response $cfg; continue
        }
        if ($path -eq "/api/subfolders" -and $method -eq "GET") {
            Handle-GetSubFolders $response $cfg $query["path"]; continue
        }
        if ($path -eq "/api/files" -and $method -eq "GET") {
            Handle-GetFiles $response $query["path"]; continue
        }
        if ($path -eq "/api/upload" -and $method -eq "POST") {
            Handle-Upload $request $response $query; continue
        }
        if ($path -eq "/api/config" -and $method -eq "GET") {
            Handle-GetConfig $response $cfg; continue
        }
        if ($path -eq "/api/config" -and $method -eq "POST") {
            Handle-SaveConfig $request $response; continue
        }

        # ---- Static Files ----
        $filePath = $path
        
        # Decide qual index usar com base no modo atual
        $indexFile = if ($root -match "dist$") { "index.html" } else { "index-dev.html" }
        
        if ($filePath -eq "/") { $filePath = "/$indexFile" }
        
        $fullPath = Join-Path $root $filePath.TrimStart('/')

        if (Test-Path $fullPath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($fullPath)
            $response.ContentType = Get-MimeType ([System.IO.Path]::GetExtension($fullPath))
            $response.ContentLength64 = $content.Length
            if ($method -ne "HEAD") {
                $response.OutputStream.Write($content, 0, $content.Length)
            }
        } else {
            # SPA Fallback or Error message
            $indexFile = if ($root -match "dist$") { "index.html" } else { "index-dev.html" }
            $index = Join-Path $root $indexFile
            
            if (Test-Path $index -PathType Leaf) {
                $content = [System.IO.File]::ReadAllBytes($index)
                $response.ContentType = "text/html; charset=utf-8"
                $response.ContentLength64 = $content.Length
                if ($method -ne "HEAD") {
                    $response.OutputStream.Write($content, 0, $content.Length)
                }
            } else {
                # Handle gracefully if both files are missing
                $errorMsg = "API OK! Mas nenhum arquivo de frontend (index.html ou index-dev.html) foi encontrado."
                $content = [System.Text.Encoding]::UTF8.GetBytes($errorMsg)
                $response.StatusCode = 404
                $response.ContentType = "text/plain; charset=utf-8"
                $response.ContentLength64 = $content.Length
                $response.OutputStream.Write($content, 0, $content.Length)
            }
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
    Write-Host "Servidor encerrado." -ForegroundColor Yellow
}
