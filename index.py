import argparse
import json
import os
import sys
from base64 import urlsafe_b64encode
from pathlib import Path


# Check if a virtual environment exists and activate it
def check_virtual_environment():
    """Check if a virtual environment exists and add it to path if necessary"""
    venv_path = Path.cwd() / ".venv"

    if venv_path.exists():
        # Add virtual environment to path
        if os.name == "nt":  # Windows
            site_packages = venv_path / "Lib" / "site-packages"
        else:  # Unix/Linux/macOS
            python_version = f"python{sys.version_info.major}.{sys.version_info.minor}"
            site_packages = venv_path / "lib" / python_version / "site-packages"

        if site_packages.exists():
            sys.path.insert(0, str(site_packages))


# Check and activate virtual environment before importing cloudscraper
check_virtual_environment()

try:
    import cloudscraper
except ImportError:
    print("Error: cloudscraper not found. Please install it using:", file=sys.stderr)
    print("  pip install cloudscraper", file=sys.stderr)
    print("  or run: npm run install-deps", file=sys.stderr)
    sys.exit(1)

parser = argparse.ArgumentParser()
parser.add_argument("--url")
parser.add_argument("--method")
parser.add_argument("--data")
parser.add_argument("--headers")
parser.add_argument("--redirect")
parser.add_argument("--timeout")
parser.add_argument("--buffer", action="store_true")
args = parser.parse_args()

try:
    timeout = int(args.timeout) if args.timeout else 30
    redirect = args.redirect if args.redirect else True
    is_buffer_request = args.buffer
    if args.method == "GET":
        req = None
        if args.headers is not None:
            headers = json.loads(args.headers)
            req = cloudscraper.create_scraper().get(
                args.url,
                timeout=timeout,
                headers=headers,
                allow_redirects=redirect,
                stream=is_buffer_request,
            )
        else:
            req = cloudscraper.create_scraper().get(
                args.url,
                timeout=timeout,
                allow_redirects=redirect,
                stream=is_buffer_request,
            )
        if is_buffer_request:
            import base64
            import sys

            sys.stdout.buffer.write(base64.urlsafe_b64encode(req.content))
        else:
            print(urlsafe_b64encode((req.text.encode("UTF-8"))))
            statusCode = {"statusCode": req.status_code}
            headersDict = dict(req.headers)
            encoded_headers = str(
                urlsafe_b64encode(json.dumps(headersDict).encode("ascii"))
            )
            responseHeaders = {"responseHeaders": encoded_headers}
            print(json.dumps(statusCode))
            print(json.dumps(responseHeaders))
    elif args.method == "POST":
        json_data = json.loads(args.data)
        req = None
        if args.headers is not None:
            headers = json.loads(args.headers)
            req = cloudscraper.create_scraper().post(
                args.url,
                data=json_data,
                timeout=timeout,
                headers=headers,
                allow_redirects=redirect,
                stream=is_buffer_request,
            )
        else:
            req = cloudscraper.create_scraper().post(
                args.url,
                data=json_data,
                timeout=timeout,
                allow_redirects=redirect,
                stream=is_buffer_request,
            )
        if is_buffer_request:
            import base64
            import sys

            sys.stdout.buffer.write(base64.urlsafe_b64encode(req.content))
        else:
            print(urlsafe_b64encode((req.text.encode("UTF-8"))))
            statusCode = {"statusCode": req.status_code}
            headersDict = dict(req.headers)
            encoded_headers = str(
                urlsafe_b64encode(json.dumps(headersDict).encode("ascii"))
            )
            responseHeaders = {"responseHeaders": encoded_headers}
            print(json.dumps(statusCode))
            print(json.dumps(responseHeaders))
    elif args.method == "COOKIE":
        print(cloudscraper.get_cookie_string(args.url))
    elif args.method == "TOKENS":
        print(cloudscraper.get_tokens(args.url))
    else:
        req = None
        if args.headers is not None:
            headers = json.loads(args.headers)
            req = cloudscraper.create_scraper().get(
                args.url,
                timeout=timeout,
                headers=headers,
                allow_redirects=redirect,
                stream=is_buffer_request,
            )
        else:
            req = cloudscraper.create_scraper().get(
                args.url,
                timeout=timeout,
                allow_redirects=redirect,
                stream=is_buffer_request,
            )
        if is_buffer_request:
            import base64
            import sys

            sys.stdout.buffer.write(base64.urlsafe_b64encode(req.content))
        else:
            print(urlsafe_b64encode((req.text.encode("UTF-8"))))
            statusCode = {"statusCode": req.status_code}
            headersDict = dict(req.headers)
            encoded_headers = str(
                urlsafe_b64encode(json.dumps(headersDict).encode("ascii"))
            )
            responseHeaders = {"responseHeaders": encoded_headers}
            print(json.dumps(statusCode))
            print(json.dumps(responseHeaders))
except Exception as e:
    raise Exception(
        "Could not send data to "
        + args.url
        + " with request data "
        + str(args.data)
        + ". Error: "
        + str(e)
    )
