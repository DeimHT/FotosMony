# Prueba de envío de email con fotos (solo desarrollo)
# Ejecutar con: .\scripts\test-email-fotos.ps1
# Requiere: npm run dev en ejecución

$body = @{
  email   = "dieterddht@gmail.com"
  name    = "Cliente prueba"
  total_clp = 4000
  items   = @(
    @{
      public_id        = "eventos/yy9lgimtjx4tornprovx"   # Reemplaza con un public_id real de tu Cloudinary
      evento_nombre    = "Boda Test"
      subevento_nombre = $null
    }
  )
} | ConvertTo-Json -Depth 4

try {
  $response = Invoke-RestMethod -Uri "http://localhost:3000/api/dev/test-email-fotos" -Method POST -Body $body -ContentType "application/json; charset=utf-8"
  Write-Host "OK:" $response.message -ForegroundColor Green
} catch {
  $statusCode = $_.Exception.Response.StatusCode.value__
  $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
  $reader.BaseStream.Position = 0
  $responseBody = $reader.ReadToEnd() | ConvertFrom-Json
  Write-Host "Error ($statusCode):" $responseBody.error -ForegroundColor Red
  if ($responseBody.detail) { Write-Host $responseBody.detail -ForegroundColor DarkGray }
}
