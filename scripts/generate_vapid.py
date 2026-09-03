#!/usr/bin/env python3
"""Generate a VAPID key pair for self-hosted web push.

Run once per deployment: backend/.venv/bin/python scripts/generate_vapid.py
Put the output into the server's environment file (never into the repo).
"""

import base64

from py_vapid import Vapid02, b64urlencode
from cryptography.hazmat.primitives import serialization

vapid = Vapid02()
vapid.generate_keys()

private = b64urlencode(
    vapid.private_key.private_bytes(
        serialization.Encoding.DER,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
)
public = b64urlencode(
    vapid.public_key.public_bytes(
        serialization.Encoding.X962,
        serialization.PublicFormat.UncompressedPoint,
    )
)

print("VAPID_PRIVATE_KEY=" + private)
print("VAPID_PUBLIC_KEY=" + public)
print("VAPID_SUBJECT=mailto:[KONTAKT-E-MAIL]")
