@echo off
echo Starting local Python HTTP server on port 8000...
echo You can access the app at:
echo   - Local: http://localhost:8000
echo   - LAN (use your IPv4 address from ipconfig): http://YOUR_IP:8000
echo Press Ctrl+C to stop the server.
python -m http.server 8000
pause
