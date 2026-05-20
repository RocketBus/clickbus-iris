"""Browser-based login for Iris CLI."""

import http.server
import os
import secrets
import socket
import sys
import threading
import webbrowser
from urllib.parse import parse_qs, urlparse

from iris.platform.config import load_config, save_config

DEFAULT_SERVER = os.environ.get("IRIS_SERVER_URL", "https://iris.clickbus.com")
TIMEOUT_SECONDS = 120


def _find_free_port() -> int:
    """Find a free port on localhost."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def browser_login(server_url: str | None = None) -> bool:
    """Open browser for login and wait for callback with token.

    Returns True on success, False on failure.
    """
    config = load_config()
    server = server_url or config.get("server_url") or DEFAULT_SERVER
    port = _find_free_port()
    state = secrets.token_urlsafe(32)

    result: dict = {}
    error: str | None = None

    class CallbackHandler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            nonlocal result, error

            parsed = urlparse(self.path)
            if parsed.path != "/callback":
                self.send_response(404)
                self.end_headers()
                return

            params = parse_qs(parsed.query)

            # Validate state
            callback_state = params.get("state", [None])[0]
            if callback_state != state:
                error = "State mismatch — possible CSRF attack. Login aborted."
                self._send_html("Authorization Failed",
                    "<p>State mismatch. Please try again.</p>")
                return

            token = params.get("token", [None])[0]
            org = params.get("org", [None])[0]
            callback_server = params.get("server", [None])[0]

            if not token or not org:
                error = "Missing token or org in callback."
                self._send_html("Authorization Failed",
                    "<p>Missing parameters. Please try again.</p>")
                return

            result["token"] = token
            result["org_slug"] = org
            result["server_url"] = callback_server or server

            self._send_html("Iris CLI Authorized",
                f"<p>Logged in to <strong>{org}</strong>.</p>"
                "<p>You can close this tab and return to your terminal.</p>")

        def _send_html(self, title: str, body: str):
            html = f"""<!DOCTYPE html>
<html><head><title>{title}</title>
<style>
  body {{ font-family: system-ui, sans-serif; background: #FAFAFA; color: #222222;
         display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }}
  .card {{ background: #FFFFFF; border: 1px solid #1f1f2e; border-radius: 8px;
           padding: 2rem; max-width: 400px; text-align: center; }}
  h1 {{ color: #A528FF; font-size: 1.2rem; font-family: monospace; }}
  p {{ color: #8888a0; font-size: 0.9rem; margin-top: 0.5rem; }}
  strong {{ color: #222222; }}
</style></head>
<body><div class="card"><h1>{title}</h1>{body}</div></body></html>"""
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(html.encode())

        def log_message(self, format, *args):
            pass  # Suppress HTTP logs

    httpd = http.server.HTTPServer(("127.0.0.1", port), CallbackHandler)
    httpd.timeout = TIMEOUT_SECONDS

    # Build authorize URL
    authorize_url = f"{server.rstrip('/')}/cli/authorize?port={port}&state={state}"

    print(f"\n  Opening browser to authorize Iris CLI...")
    print(f"  URL: {authorize_url}\n")
    print(f"  Waiting for authorization... (timeout: {TIMEOUT_SECONDS}s)")
    print(f"  Press Ctrl+C to cancel.\n")

    webbrowser.open(authorize_url)

    # Wait for one request (the callback)
    try:
        httpd.handle_request()
    except KeyboardInterrupt:
        print("\n  Login cancelled.")
        return False
    finally:
        httpd.server_close()

    if error:
        print(f"\n  Error: {error}", file=sys.stderr)
        return False

    if not result:
        print("\n  Timed out waiting for authorization.", file=sys.stderr)
        return False

    # Save to config
    config["server_url"] = result["server_url"]
    config["token"] = result["token"]
    config["org_slug"] = result["org_slug"]
    save_config(config)

    print(f"  Logged in to {result['org_slug']} at {result['server_url']}")
    print(f"  Token: {result['token'][:12]}...")
    print(f"  Config saved to ~/.iris/config.json\n")
    return True


def manual_login(server_url: str, token: str) -> bool:
    """Manual token login (for CI/CD or headless environments)."""
    if not token.startswith("iris_"):
        print("Error: token must start with 'iris_'", file=sys.stderr)
        return False

    config = load_config()
    config["server_url"] = server_url
    config["token"] = token
    save_config(config)

    print(f"  Authenticated with {server_url}")
    print(f"  Token: {token[:12]}...")
    print(f"  Config saved to ~/.iris/config.json")
    return True
