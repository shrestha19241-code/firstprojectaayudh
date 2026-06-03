import json
import os
import urllib.error
import urllib.request


class SupabaseConfigError(RuntimeError):
    """Raised when required Supabase environment variables are missing."""


class SupabaseRequestError(RuntimeError):
    """Raised when Supabase REST API returns an error."""

    def __init__(self, message, status_code=502):
        super().__init__(message)
        self.status_code = status_code


class SupabaseRestClient:
    """
    Backend-only Supabase REST client.

    Credentials are read from environment variables only:
    - SUPABASE_URL
    - SUPABASE_ANON_KEY

    No Supabase credentials are exposed to the React frontend.
    """

    @property
    def is_configured(self):
        return bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_ANON_KEY"))

    def _settings(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY")

        if not supabase_url or not supabase_key:
            raise SupabaseConfigError(
                "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in the backend environment."
            )

        return supabase_url.rstrip("/"), supabase_key

    def _request(self, method, path, payload=None):
        supabase_url, supabase_key = self._settings()
        url = f"{supabase_url}/rest/v1/{path.lstrip('/')}"

        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Accept": "application/json",
        }

        data = None
        if payload is not None:
            headers["Content-Type"] = "application/json"
            headers["Prefer"] = "return=representation"
            data = json.dumps(payload).encode("utf-8")

        request = urllib.request.Request(url, data=data, headers=headers, method=method)

        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                raw = response.read().decode("utf-8")
                return json.loads(raw) if raw else None
        except urllib.error.HTTPError as exc:
            raw_error = exc.read().decode("utf-8")
            try:
                detail = json.loads(raw_error)
            except json.JSONDecodeError:
                detail = raw_error or str(exc)
            raise SupabaseRequestError(str(detail), exc.code) from exc
        except urllib.error.URLError as exc:
            raise SupabaseRequestError(f"Unable to reach Supabase: {exc.reason}") from exc

    def get_products(self):
        return self._request("GET", "products?select=*") or []

    def get_offers(self):
        return self._request("GET", "offers?select=*") or []

    def create_order(self, order_payload):
        return self._request("POST", "orders", order_payload)

    def get_orders(self):
        return self._request("GET", "orders?select=*") or []