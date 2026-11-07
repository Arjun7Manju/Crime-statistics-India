import http.server
import socketserver
import webbrowser
import os
import sys

PORTS = [3000, 8000, 8080, 5000, 8888]

def run_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    handler = http.server.SimpleHTTPRequestHandler
    handler.extensions_map.update({
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.html': 'text/html'
    })

    server = None
    chosen_port = None

    for port in PORTS:
        try:
            server = socketserver.TCPServer(("", port), handler)
            chosen_port = port
            break
        except OSError:
            continue

    if not server:
        print("ERROR: Could not bind to any standard port. Please close running servers.")
        sys.exit(1)

    url = f"http://localhost:{chosen_port}"
    print("=" * 60)
    print(f"  NCRB CrimeStat India Analytics Portal")
    print(f"  Serving locally at: {url}")
    print(f"  Press Ctrl+C to terminate the server.")
    print("=" * 60)

    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"Note: Could not automatically open browser ({e}). Please navigate to {url}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping NCRB CrimeStat server. Goodbye!")
        server.server_close()

if __name__ == '__main__':
    run_server()

