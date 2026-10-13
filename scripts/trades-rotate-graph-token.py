#!/usr/bin/env python3
"""Rotate Microsoft Graph refresh token in encrypted private R2 state.

Bootstrap from GitHub Actions secret; persist only AES-GCM ciphertext.
The key is derived from the existing Cloudflare API token, so rotating
that Cloudflare credential also requires resetting the encrypted state.
"""
import base64
import hashlib
import json
import os
from pathlib import Path
import urllib.parse
import urllib.request
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

STATE = Path("/tmp/trades-graph-token.enc")
TOKEN = Path("/tmp/trades-graph-refresh-token")
key = hashlib.sha256(b"PrimeSphere/GraphRefresh/v1\x00" + os.environ["CLOUDFLARE_API_TOKEN"].encode()).digest()
aes = AESGCM(key)
refresh = os.environ["MS_GRAPH_REFRESH_TOKEN"]
if STATE.exists() and STATE.stat().st_size:
    blob = json.loads(STATE.read_text())
    if blob.get("version") != 1:
        raise RuntimeError("Unknown encrypted token state")
    refresh = aes.decrypt(base64.b64decode(blob["nonce"]), base64.b64decode(blob["ciphertext"]), b"PrimeSphere/GraphRefresh/v1").decode()
payload = urllib.parse.urlencode({
    "client_id":os.environ["MS_GRAPH_CLIENT_ID"],
    "grant_type":"refresh_token",
    "refresh_token":refresh,
    "scope":"offline_access Files.Read",
}).encode()
req = urllib.request.Request("https://login.microsoftonline.com/consumers/oauth2/v2.0/token",data=payload,headers={"Content-Type":"application/x-www-form-urlencoded"})
with urllib.request.urlopen(req,timeout=45) as response:
    result = json.load(response)
next_refresh = result.get("refresh_token")
if not next_refresh:
    raise RuntimeError("Microsoft did not return a rotated refresh token")
TOKEN.write_text(next_refresh)
TOKEN.chmod(0o600)
nonce = os.urandom(12)
STATE.write_text(json.dumps({"version":1,"nonce":base64.b64encode(nonce).decode(),"ciphertext":base64.b64encode(aes.encrypt(nonce,next_refresh.encode(),b"PrimeSphere/GraphRefresh/v1")).decode()}))
STATE.chmod(0o600)
print("Microsoft Graph refresh token rotated; encrypted state prepared")
