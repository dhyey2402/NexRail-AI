"""
Abstract base HTTP client for external service integrations.
"""
import asyncio
import logging
import httpx
from typing import Any, Dict, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class BaseAPIClient:
    """
    Reusable HTTP client using httpx.AsyncClient.
    Provides standard error handling, configurable timeouts, and exponential backoff retry logic.
    """
    def __init__(self, base_url: str = "") -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = settings.http_timeout
        self.max_retries = 3
        self.retry_delay = 0.5

    async def _get(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Execute an HTTP GET request with timeouts, custom headers, and retry logic.
        
        Args:
            endpoint (str): The API endpoint path.
            params (Dict[str, Any], optional): Query parameters.
            headers (Dict[str, str], optional): HTTP request headers.
            
        Returns:
            Dict[str, Any]: Parsed JSON response.
            
        Raises:
            httpx.HTTPStatusError: If client returns a 4xx error (not retried) or persistent 5xx.
            httpx.RequestError: If network request fails after exhausting retries.
        """
        if not endpoint.startswith("/"):
            endpoint = f"/{endpoint}"
        url = f"{self.base_url}{endpoint}"
        
        last_exception = None
        for attempt in range(1, self.max_retries + 1):
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                try:
                    response = await client.get(url, params=params, headers=headers)
                    # For client errors (4xx), raise immediately without retrying
                    if 400 <= response.status_code < 500:
                        response.raise_for_status()
                    # For server errors (5xx), raise to trigger retry
                    response.raise_for_status()
                    return response.json()
                except httpx.HTTPStatusError as e:
                    last_exception = e
                    # Do not retry on 4xx client errors (e.g. 404 Not Found, 401 Unauthorized)
                    if 400 <= e.response.status_code < 500:
                        raise
                    logger.warning(
                        f"Attempt {attempt}/{self.max_retries} failed for {url} with status {e.response.status_code}: {e}"
                    )
                except httpx.RequestError as e:
                    last_exception = e
                    logger.warning(
                        f"Attempt {attempt}/{self.max_retries} connection error for {url}: {e}"
                    )

            if attempt < self.max_retries:
                await asyncio.sleep(self.retry_delay * (2 ** (attempt - 1)))

        if last_exception:
            raise last_exception
        raise httpx.RequestError(f"Request failed for {url} after {self.max_retries} attempts")
