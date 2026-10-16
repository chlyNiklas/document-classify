import base64
import time
import unittest

import httpx
import jwt
from fastapi import HTTPException

from koby_classify.api.auth import (
    AuthenticatedPrincipal,
    OidcTokenValidator,
    get_authenticated_principal,
    require_classify_access,
)
from koby_classify.config import Settings


def _base64url(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


class TokenValidatorTests(unittest.IsolatedAsyncioTestCase):
    async def test_requires_bearer_credentials_when_authentication_is_enabled(self) -> None:
        settings = Settings(
            auth_enabled=True,
            auth_issuer="https://identity.example",
            auth_audience="classify-api",
            auth_jwks_url="https://identity.example/certs",
        )
        validator = OidcTokenValidator(settings)

        with self.assertRaises(HTTPException) as raised:
            await get_authenticated_principal(None, settings, validator)

        self.assertEqual(raised.exception.status_code, 401)
        self.assertEqual(raised.exception.headers, {"WWW-Authenticate": "Bearer"})

    async def test_validates_signature_claims_and_scopes(self) -> None:
        secret = b"a-test-signing-secret-that-is-long-enough"
        settings = Settings(
            auth_enabled=True,
            auth_issuer="https://identity.example/realms/classify",
            auth_audience="classify-api",
            auth_jwks_url="https://identity.example/realms/classify/certs",
            auth_algorithms=["HS256"],
        )

        def handler(request: httpx.Request) -> httpx.Response:
            self.assertEqual(str(request.url), settings.auth_jwks_url)
            return httpx.Response(
                200,
                json={
                    "keys": [
                        {
                            "kty": "oct",
                            "kid": "test-key",
                            "alg": "HS256",
                            "k": _base64url(secret),
                        }
                    ]
                },
            )

        token = jwt.encode(
            {
                "sub": "user-123",
                "client_id": "classify-ui",
                "iss": settings.auth_issuer,
                "aud": settings.auth_audience,
                "scope": "openid document:classify",
                "exp": int(time.time()) + 60,
            },
            secret,
            algorithm="HS256",
            headers={"kid": "test-key"},
        )
        validator = OidcTokenValidator(settings, transport=httpx.MockTransport(handler))

        principal = await validator.validate(token)

        self.assertEqual(principal.subject, "user-123")
        self.assertEqual(principal.client_id, "classify-ui")
        self.assertIn("document:classify", principal.scopes)

    async def test_rejects_wrong_audience(self) -> None:
        secret = b"a-test-signing-secret-that-is-long-enough"
        settings = Settings(
            auth_enabled=True,
            auth_issuer="https://identity.example/realms/classify",
            auth_audience="classify-api",
            auth_jwks_url="https://identity.example/realms/classify/certs",
            auth_algorithms=["HS256"],
        )

        def handler(_: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={
                    "keys": [
                        {
                            "kty": "oct",
                            "kid": "test-key",
                            "alg": "HS256",
                            "k": _base64url(secret),
                        }
                    ]
                },
            )

        token = jwt.encode(
            {
                "sub": "user-123",
                "iss": settings.auth_issuer,
                "aud": "another-api",
                "scope": "document:classify",
                "exp": int(time.time()) + 60,
            },
            secret,
            algorithm="HS256",
            headers={"kid": "test-key"},
        )
        validator = OidcTokenValidator(settings, transport=httpx.MockTransport(handler))

        with self.assertRaises(HTTPException) as raised:
            await validator.validate(token)

        self.assertEqual(raised.exception.status_code, 401)
        self.assertEqual(raised.exception.headers, {"WWW-Authenticate": "Bearer"})

    async def test_accepts_machine_token_without_user_subject(self) -> None:
        secret = b"a-test-signing-secret-that-is-long-enough"
        settings = Settings(
            auth_enabled=True,
            auth_issuer="https://identity.example/realms/classify",
            auth_audience="classify-api",
            auth_jwks_url="https://identity.example/realms/classify/certs",
            auth_algorithms=["HS256"],
        )

        def handler(_: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={
                    "keys": [
                        {
                            "kty": "oct",
                            "kid": "test-key",
                            "alg": "HS256",
                            "k": _base64url(secret),
                        }
                    ]
                },
            )

        token = jwt.encode(
            {
                "client_id": "batch-classifier",
                "iss": settings.auth_issuer,
                "aud": settings.auth_audience,
                "scope": "document:classify",
                "exp": int(time.time()) + 60,
            },
            secret,
            algorithm="HS256",
            headers={"kid": "test-key"},
        )
        validator = OidcTokenValidator(settings, transport=httpx.MockTransport(handler))

        principal = await validator.validate(token)

        self.assertEqual(principal.subject, "batch-classifier")
        self.assertEqual(principal.client_id, "batch-classifier")

    async def test_rejects_missing_scope(self) -> None:
        settings = Settings(
            auth_enabled=True,
            auth_issuer="https://identity.example",
            auth_audience="classify-api",
            auth_jwks_url="https://identity.example/certs",
        )
        principal = AuthenticatedPrincipal(
            subject="user-123",
            client_id="classify-ui",
            scopes=frozenset({"openid"}),
            claims={},
        )

        with self.assertRaises(HTTPException) as raised:
            await require_classify_access(principal, settings)

        self.assertEqual(raised.exception.status_code, 403)
        self.assertIn("insufficient_scope", raised.exception.headers["WWW-Authenticate"])


if __name__ == "__main__":
    unittest.main()
