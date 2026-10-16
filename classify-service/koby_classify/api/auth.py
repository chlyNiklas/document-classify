from __future__ import annotations

import asyncio
from dataclasses import dataclass
from time import monotonic
from typing import Annotated, Any

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWK, PyJWTError

from koby_classify.config import Settings, get_settings

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthenticatedPrincipal:
    subject: str
    client_id: str | None
    scopes: frozenset[str]
    claims: dict[str, Any]


class OidcTokenValidator:
    def __init__(
        self,
        settings: Settings,
        *,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._enabled = settings.auth_enabled
        self._issuer = settings.auth_issuer
        self._audience = settings.auth_audience
        self._jwks_url = settings.auth_jwks_url
        self._algorithms = settings.auth_algorithms
        self._cache_seconds = settings.auth_jwks_cache_seconds
        self._transport = transport
        self._keys: dict[str, PyJWK] = {}
        self._keys_expires_at = 0.0
        self._keys_lock = asyncio.Lock()

    async def validate(self, token: str) -> AuthenticatedPrincipal:
        if not self._enabled:
            return AuthenticatedPrincipal(
                subject="authentication-disabled",
                client_id=None,
                scopes=frozenset({"*"}),
                claims={},
            )

        try:
            header = jwt.get_unverified_header(token)
            algorithm = header.get("alg")
            key_id = header.get("kid")
            if algorithm not in self._algorithms or not isinstance(key_id, str):
                raise PyJWTError("Token algorithm or key id is not allowed")
            key = await self._key(key_id)
            claims = jwt.decode(
                token,
                key=key.key,
                algorithms=self._algorithms,
                audience=self._audience,
                issuer=self._issuer,
                options={"require": ["aud", "exp", "iss"]},
            )
        except (PyJWTError, KeyError, TypeError, ValueError) as error:
            raise _unauthorized("Invalid access token") from error

        client_id = _client_id(claims)
        subject = claims.get("sub")
        if not isinstance(subject, str) or not subject:
            subject = client_id
        if subject is None:
            raise _unauthorized("Invalid access token")
        return AuthenticatedPrincipal(
            subject=subject,
            client_id=client_id,
            scopes=_scopes(claims),
            claims=claims,
        )

    async def _key(self, key_id: str) -> PyJWK:
        if monotonic() >= self._keys_expires_at or key_id not in self._keys:
            await self._refresh_keys()
        key = self._keys.get(key_id)
        if key is None:
            # A rotation may have happened before the cache expired. Refresh once before rejecting.
            await self._refresh_keys(force=True)
            key = self._keys.get(key_id)
        if key is None:
            raise PyJWTError("No matching signing key")
        return key

    async def _refresh_keys(self, *, force: bool = False) -> None:
        async with self._keys_lock:
            if not force and self._keys and monotonic() < self._keys_expires_at:
                return
            try:
                async with httpx.AsyncClient(
                    timeout=httpx.Timeout(10.0),
                    transport=self._transport,
                ) as client:
                    response = await client.get(str(self._jwks_url))
                    response.raise_for_status()
                    payload = response.json()
                keys = payload["keys"]
                if not isinstance(keys, list):
                    raise ValueError("JWKS keys must be a list")
                parsed = {
                    key_id: PyJWK.from_dict(value)
                    for value in keys
                    if isinstance(value, dict)
                    and isinstance((key_id := value.get("kid")), str)
                }
                if not parsed:
                    raise ValueError("JWKS contains no usable keys")
            except (httpx.HTTPError, PyJWTError, KeyError, TypeError, ValueError) as error:
                raise _unauthorized("Signing keys are unavailable") from error
            self._keys = parsed
            self._keys_expires_at = monotonic() + self._cache_seconds


_validator: OidcTokenValidator | None = None


def get_token_validator(
    settings: Annotated[Settings, Depends(get_settings)],
) -> OidcTokenValidator:
    global _validator
    if _validator is None:
        _validator = OidcTokenValidator(settings)
    return _validator


async def get_authenticated_principal(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    settings: Annotated[Settings, Depends(get_settings)],
    validator: Annotated[OidcTokenValidator, Depends(get_token_validator)],
) -> AuthenticatedPrincipal:
    if not settings.auth_enabled:
        return await validator.validate("")
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized("Bearer access token required")
    return await validator.validate(credentials.credentials)


async def require_classify_access(
    principal: Annotated[AuthenticatedPrincipal, Depends(get_authenticated_principal)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AuthenticatedPrincipal:
    if settings.auth_enabled and settings.auth_required_scope not in principal.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient scope",
            headers={
                "WWW-Authenticate": (
                    'Bearer error="insufficient_scope", '
                    f'scope="{settings.auth_required_scope}"'
                )
            },
        )
    return principal


def _scopes(claims: dict[str, Any]) -> frozenset[str]:
    scopes: set[str] = set()
    for name in ("scope", "scp", "roles"):
        raw = claims.get(name, "")
        if isinstance(raw, str):
            scopes.update(raw.split())
        elif isinstance(raw, list):
            scopes.update(item for item in raw if isinstance(item, str))
    return frozenset(scopes)


def _client_id(claims: dict[str, Any]) -> str | None:
    for name in ("client_id", "azp", "appid"):
        value = claims.get(name)
        if isinstance(value, str) and value:
            return value
    return None


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )
