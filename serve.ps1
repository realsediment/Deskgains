# Tiny local web server for DeskGains (no installs needed). Leave this window open while you install the app.
$port = 8765
$root = [IO.Path]::GetFullPath($PSScriptRoot)
$mime = @{ '.html'='text/html; charset=utf-8'; '.js'='application/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8';
           '.png'='image/png'; '.webmanifest'='application/manifest+json'; '.json'='application/json' }
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try { $listener.Start() } catch { Write-Host "Could not start on port $port. Close whatever is using it and try again."; pause; exit 1 }
Write-Host "DeskGains is running at http://localhost:$port/  (open that in Edge, then close this window after installing)"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.LocalPath).TrimStart('/')
    if ($rel -eq '') { $rel = 'index.html' }
    $file = [IO.Path]::GetFullPath((Join-Path $root $rel))
    if ($file.StartsWith($root) -and (Test-Path $file -PathType Leaf)) {
      $bytes = [IO.File]::ReadAllBytes($file)
      $ext = [IO.Path]::GetExtension($file).ToLower()
      $ctx.Response.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' })
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else { $ctx.Response.StatusCode = 404 }
  } catch { $ctx.Response.StatusCode = 500 }
  $ctx.Response.Close()
}
