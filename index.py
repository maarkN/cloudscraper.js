import argparse
import json
from base64 import urlsafe_b64encode

import cloudscraper

parser = argparse.ArgumentParser()
parser.add_argument("--url")
parser.add_argument("--method")
parser.add_argument("--data")
parser.add_argument("--headers")
parser.add_argument("--redirect")
parser.add_argument("--timeout")
args = parser.parse_args()

try:
    timeout = args.timeout if args.timeout else 10
    redirect = args.redirect if args.redirect else True
    if args.method == "GET":
        req = None
        if args.headers != None:
            headers = json.loads(args.headers)
            req = cloudscraper.create_scraper().get(
                args.url,
                timeout=timeout,
                headers=headers,
                allow_redirects=redirect,
            )
        else:
            req = cloudscraper.create_scraper().get(
                args.url, timeout=timeout, allow_redirects=redirect
            )
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
        if args.headers != None:
            headers = json.loads(args.headers)
            req = cloudscraper.create_scraper().post(
                args.url,
                data=json_data,
                timeout=timeout,
                headers=headers,
                allow_redirects=redirect,
            )
        else:
            req = cloudscraper.create_scraper().post(
                args.url, data=json_data, timeout=timeout, allow_redirects=redirect
            )
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
        if args.headers != None:
            headers = json.loads(args.headers)
            req = cloudscraper.create_scraper().get(
                args.url,
                timeout=timeout,
                headers=headers,
                allow_redirects=redirect,
            )
        else:
            req = cloudscraper.create_scraper().get(
                args.url, timeout=timeout, allow_redirects=redirect
            )
        print(urlsafe_b64encode((req.text.encode("UTF-8"))))

        statusCode = {"statusCode": req.status_code}

        headersDict = dict(req.headers)
        encoded_headers = str(
            urlsafe_b64encode(json.dumps(headersDict).encode("ascii"))
        )

        responseHeaders = {"responseHeaders": encoded_headers}

        print(json.dumps(statusCode))
        print(json.dumps(responseHeaders))
except:
    raise Exception(
        "Could not send data to " + args.url + " with request data " + args.data + "."
    )
