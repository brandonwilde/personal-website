#!/usr/bin/env python3
"""Dev server for this site.

Serves the repo over the LAN so a phone on the same wifi can reach it, and sends
Cache-Control: no-store — under plain http.server the browser caches the ES
modules and quietly boots a mix of old and new files.
"""

import argparse
import functools
import http.server
import os
import socket
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.abspath(__file__))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    # Keep-alive: the page pulls ~30 ES modules, and HTTP/1.0 opens a connection
    # per module — enough parallel requests to overrun the listen backlog.
    protocol_version = 'HTTP/1.1'

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    # Binding to every interface publishes the whole directory, .git and .claude
    # included. Nothing starting with a dot is ever part of the site.
    def send_head(self):
        path = urllib.parse.urlparse(self.path).path
        if any(part.startswith('.') for part in path.split('/') if part):
            self.send_error(404)
            return None
        return super().send_head()


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 64


def lan_ip():
    # No packets are sent; connect() on UDP just picks the outbound interface.
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        return s.getsockname()[0]
    except OSError:
        return '127.0.0.1'
    finally:
        s.close()


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('-p', '--port', type=int, default=8000)
    ap.add_argument('--host', default='0.0.0.0',
                    help='bind address; 127.0.0.1 keeps it off the network')
    args = ap.parse_args()

    handler = functools.partial(NoCacheHandler, directory=ROOT)
    try:
        server = Server((args.host, args.port), handler)
    except OSError as e:
        sys.exit(f'cannot bind {args.host}:{args.port} — {e.strerror}')

    print(f'  serving:        {ROOT}')
    print(f'  this computer:  http://localhost:{args.port}')
    if args.host == '0.0.0.0':
        print(f'  phone on wifi:  http://{lan_ip()}:{args.port}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print()


if __name__ == '__main__':
    main()
