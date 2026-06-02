"""
Client météo — OpenWeatherMap (gratuit, 1000 appels/jour).
Fournit les températures réelles de Tunis pour les 5 prochains jours,
et les normales climatiques pour les horizons 15j et 30j.

Configuration :
  Créer un fichier  dindor-ai/.env  avec :
      OWM_API_KEY=votre_clé_ici

  Ou définir la variable d'environnement OWM_API_KEY.
  Clé gratuite sur https://openweathermap.org/api → "Current Weather + Forecast"
"""
from __future__ import annotations

import logging
import os
import time
from datetime import date, timedelta
from pathlib import Path
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
OWM_BASE    = "https://api.openweathermap.org/data/2.5"
CITY_ID     = "2464470"          # Tunis, TN (identifiant stable OWM)
UNITS       = "metric"           # Celsius
CACHE_TTL   = 6 * 3600           # recharge les données toutes les 6 h
_ENV_FILE   = Path(__file__).parent / ".env"

# ── Normales climatiques mensuelles de Tunis (°C, moyenne journalière)
# Source : https://fr.climate-data.org/afrique/tunisie/tunis-5/
TUNIS_CLIMATE_NORMALS: dict[int, float] = {
    1:  11.5, 2:  12.3, 3:  14.5, 4:  17.0,
    5:  21.0, 6:  25.5, 7:  28.5, 8:  28.8,
    9:  25.5, 10: 21.0, 11: 16.0, 12: 12.5,
}

# Seuils de température significatifs pour le prix du poulet
TEMP_WARM      = 28.0   # °C — chaleur commence à stresser les élevages
TEMP_HOT       = 33.0   # °C — mortalité en hausse, coût élevage ↑
TEMP_EXTREME   = 38.0   # °C — vague de chaleur, impact très fort
TEMP_COLD      = 10.0   # °C — froid → consommation chauffage ↑, prix ↑


# ── Chargement clé API ────────────────────────────────────────────────────────

def _load_api_key() -> Optional[str]:
    """Cherche la clé dans .env puis dans les variables d'environnement."""
    if _ENV_FILE.exists():
        for line in _ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("OWM_API_KEY"):
                parts = line.split("=", 1)
                if len(parts) == 2:
                    key = parts[1].strip().strip('"').strip("'")
                    if key and key != "votre_clé_ici":
                        return key
    return os.environ.get("OWM_API_KEY") or None


# ── Cache mémoire ─────────────────────────────────────────────────────────────

class _WeatherCache:
    def __init__(self) -> None:
        self._data:    dict[date, float] = {}   # date → temp moyenne °C
        self._ts:      float = 0.0              # timestamp du dernier chargement
        self._source:  str   = "none"

    @property
    def is_fresh(self) -> bool:
        return (time.monotonic() - self._ts) < CACHE_TTL

    def update(self, data: dict[date, float], source: str) -> None:
        self._data   = data
        self._ts     = time.monotonic()
        self._source = source
        logger.info("Cache météo mis à jour (%s) — %d jours", source, len(data))

    def get(self, d: date) -> Optional[float]:
        return self._data.get(d)

    @property
    def source(self) -> str:
        return self._source

    @property
    def nb_days(self) -> int:
        return len(self._data)


_CACHE = _WeatherCache()


# ── Appel OpenWeatherMap ──────────────────────────────────────────────────────

def _fetch_owm_forecast(api_key: str) -> dict[date, float]:
    """
    Appelle l'API OWM /forecast (gratuit, 5 jours / 3 heures).
    Retourne un dict date → température moyenne journalière.
    """
    url = f"{OWM_BASE}/forecast"
    params = {"id": CITY_ID, "appid": api_key, "units": UNITS, "cnt": 40}

    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise RuntimeError("Clé API OpenWeatherMap invalide (401). Vérifiez .env") from e
        raise

    # Agréger par jour (moyenne des créneaux 3 h)
    daily: dict[date, list[float]] = {}
    for item in data.get("list", []):
        dt = date.fromtimestamp(item["dt"])
        temp = item["main"]["temp"]
        daily.setdefault(dt, []).append(temp)

    return {d: sum(temps) / len(temps) for d, temps in daily.items()}


def _climate_normal_forecast(nb_days: int = 30, start: Optional[date] = None) -> dict[date, float]:
    """Retourne les normales climatiques pour les N prochains jours."""
    start = start or date.today()
    return {
        start + timedelta(days=i): TUNIS_CLIMATE_NORMALS[((start + timedelta(days=i)).month)]
        for i in range(nb_days)
    }


# ── API publique ──────────────────────────────────────────────────────────────

def get_forecast(force_refresh: bool = False) -> dict[date, float]:
    """
    Retourne le forecast de température (date → °C) pour les 30 prochains jours.
    - Jours 1-5 : données réelles OWM si la clé est configurée
    - Jours 6-30 : normales climatiques de Tunis
    Si pas de clé API → 100% normales climatiques (toujours fonctionnel).
    """
    if _CACHE.is_fresh and not force_refresh:
        return dict(_CACHE._data)

    api_key = _load_api_key()
    normals = _climate_normal_forecast(nb_days=35)

    if not api_key:
        logger.warning(
            "OWM_API_KEY non configurée — utilisation des normales climatiques de Tunis. "
            "Créez dindor-ai/.env avec OWM_API_KEY=votre_clé pour des données réelles."
        )
        _CACHE.update(normals, source="normales_climatiques")
        return dict(normals)

    try:
        owm_data = _fetch_owm_forecast(api_key)
        # Fusionner : OWM pour les 5 premiers jours, normales pour le reste
        merged = {**normals, **owm_data}   # OWM écrase les normales sur 5 jours
        _CACHE.update(merged, source="openweathermap")
        return dict(merged)
    except Exception as e:
        logger.warning("OpenWeatherMap inaccessible (%s) — fallback normales climatiques", e)
        _CACHE.update(normals, source="normales_climatiques_fallback")
        return dict(normals)


def get_temp_for_date(d: date) -> float:
    """Retourne la température prévue pour une date donnée."""
    forecast = get_forecast()
    if d in forecast:
        return forecast[d]
    # Hors horizon : normale du mois
    return TUNIS_CLIMATE_NORMALS[d.month]


def build_weather_features(dates: list[date]) -> dict[str, list[int]]:
    """
    Retourne un dict de listes binaires pour chaque feature météo,
    prêt à être ajouté comme regresseur Prophet.

    Features :
      - chaleur_moderee  : temp ≥ 28°C  (stress léger élevage)
      - canicule         : temp ≥ 33°C  (mortalité en hausse)
      - vague_chaleur    : temp ≥ 38°C  (impact fort)
      - grand_froid      : temp ≤ 10°C  (coût chauffage)
    """
    forecast = get_forecast()
    result: dict[str, list[int]] = {
        "chaleur_moderee": [],
        "canicule":        [],
        "vague_chaleur":   [],
        "grand_froid":     [],
    }
    for d in dates:
        temp = forecast.get(d, TUNIS_CLIMATE_NORMALS[d.month])
        result["chaleur_moderee"].append(int(temp >= TEMP_WARM))
        result["canicule"].append(int(temp >= TEMP_HOT))
        result["vague_chaleur"].append(int(temp >= TEMP_EXTREME))
        result["grand_froid"].append(int(temp <= TEMP_COLD))
    return result


def weather_status() -> dict:
    """Résumé de l'état du service météo (pour l'endpoint /weather/status)."""
    api_key = _load_api_key()
    today_temp = get_temp_for_date(date.today())
    return {
        "api_key_configured": api_key is not None,
        "source": _CACHE.source if _CACHE.nb_days > 0 else "non_chargé",
        "nb_days_cached": _CACHE.nb_days,
        "cache_fresh": _CACHE.is_fresh,
        "temperature_tunis_aujourd_hui": round(today_temp, 1),
        "ville": "Tunis, TN",
        "note": (
            "Données réelles OpenWeatherMap (5j) + normales climatiques (30j)"
            if api_key else
            "Normales climatiques uniquement — configurez OWM_API_KEY dans .env pour des données réelles"
        ),
    }
