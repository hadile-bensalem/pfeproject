"""
Chargeur de données Excel pour le service IA Dindor.
Lit tous les fichiers .xlsx / .xls dans le dossier data/ et les normalise.

Cache : chaque fichier Excel est rechargé seulement quand sa date de modification change.
"""
from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Literal

import pandas as pd

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent / "data"

# ── Cache fichier Excel ───────────────────────────────────────────────────────
# Clé = chemin absolu (str), valeur = (DataFrame, mtime_float)
_FILE_CACHE: dict[str, tuple[pd.DataFrame, float]] = {}

# ── Variantes de noms de colonnes acceptées ───────────────────────────────
_DATE_COLS    = {"date", "date_facture", "datefacture", "date_achat", "dateachat",
                 "date_vente", "datevente", "jour", "day",
                 "date2"}                          # ← ACHAT.XLS / vente.XLS
_ARTICLE_COLS = {"article", "designation", "produit", "description", "libelle",
                 "article_designation", "nom", "name", "item"}
_QTE_COLS     = {"quantite", "quantité", "qte", "qty", "quantity", "qté", "nb",
                 "nombre", "volume",
                 "qte_sortie"}                     # ← vente.XLS
# Liste ordonnée par priorité : puremise (prix après remise) prime sur pu
_PRIX_COLS_PRIORITY = [
    "puremise",          # ← ACHAT.XLS : prix après remise (prix réel payé)
    "prix_achat", "prix_unitaire", "prixunitaire", "prix_ht",
    "prix_unitaire_ht", "pu", "unit_price", "price",
    "montant_unitaire", "cout_unitaire", "prix",
]
_PRIX_COLS    = set(_PRIX_COLS_PRIORITY)           # pour recherche rapide


def _normalize_col(name: str) -> str:
    """Normalise un nom de colonne : minuscules, sans accents, sans espaces."""
    name = name.lower().strip()
    name = name.replace("é", "e").replace("è", "e").replace("ê", "e")
    name = name.replace("à", "a").replace("â", "a")
    name = name.replace("ù", "u").replace("û", "u")
    name = re.sub(r"[\s\-_]+", "_", name)
    name = re.sub(r"[^a-z0-9_]", "", name)
    return name


def _find_col(df: pd.DataFrame, candidates) -> str | None:
    """
    Trouve la colonne du DataFrame dont le nom normalisé est dans candidates.
    Si candidates est une liste ordonnée, respecte l'ordre de priorité.
    """
    col_map = {_normalize_col(col): col for col in df.columns}
    if isinstance(candidates, list):
        # Priorité explicite : on parcourt la liste de préférence
        for c in candidates:
            if c in col_map:
                return col_map[c]
        return None
    # Fallback set : premier trouvé dans l'ordre des colonnes du DataFrame
    for col in df.columns:
        if _normalize_col(col) in candidates:
            return col
    return None


def _parse_dates(series: pd.Series) -> pd.Series:
    """Essaie plusieurs formats de date."""
    formats = [
        "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y",
        "%d %b %Y", "%d %B %Y", "%Y/%m/%d",
    ]
    for fmt in formats:
        try:
            parsed = pd.to_datetime(series, format=fmt, errors="coerce")
            if parsed.notna().sum() > len(series) * 0.7:
                return parsed
        except Exception:
            continue
    return pd.to_datetime(series, errors="coerce")


def load_excel_file_cached(
    path: Path,
    source: Literal["achat", "vente"] = "achat",
) -> pd.DataFrame:
    """Charge un fichier Excel depuis le disque, ou retourne le cache si inchangé."""
    key = str(path.resolve())
    try:
        mtime = path.stat().st_mtime
    except OSError:
        return pd.DataFrame()

    cached = _FILE_CACHE.get(key)
    if cached is not None and cached[1] == mtime:
        logger.debug("Cache hit : %s", path.name)
        return cached[0]

    df = load_excel_file(path, source)
    _FILE_CACHE[key] = (df, mtime)
    logger.info("Cache mis à jour : %s (%d lignes)", path.name, len(df))
    return df


def load_excel_file(
    path: Path,
    source: Literal["achat", "vente"] = "achat",
) -> pd.DataFrame:
    """
    Charge un fichier Excel (toutes les feuilles) et retourne un DataFrame normalisé :
    colonnes : date (date), article (str), prix (float), quantite (float), source (str)
    """
    # Choisir le moteur selon l'extension
    ext = path.suffix.lower()
    engine = "xlrd" if ext in (".xls",) else "openpyxl"
    try:
        xl = pd.ExcelFile(path, engine=engine)
    except Exception as e:
        # Tentative avec l'autre moteur si le premier échoue
        alt_engine = "openpyxl" if engine == "xlrd" else "xlrd"
        try:
            xl = pd.ExcelFile(path, engine=alt_engine)
        except Exception:
            logger.error("Impossible de lire %s : %s", path, e)
            return pd.DataFrame()

    frames = []
    for sheet in xl.sheet_names:
        try:
            df = xl.parse(sheet)
        except Exception:
            continue
        if df.empty or len(df.columns) < 2:
            continue

        # Trouver les colonnes (prix : liste ordonnée pour respecter la priorité puremise > pu)
        date_col    = _find_col(df, _DATE_COLS)
        article_col = _find_col(df, _ARTICLE_COLS)
        qte_col     = _find_col(df, _QTE_COLS)
        prix_col    = _find_col(df, _PRIX_COLS_PRIORITY)

        if not date_col or not article_col or not prix_col:
            logger.warning(
                "%s (feuille '%s') : colonnes manquantes — date=%s, article=%s, prix=%s",
                path.name, sheet, date_col, article_col, prix_col
            )
            continue

        df2 = pd.DataFrame()
        df2["date"]     = _parse_dates(df[date_col])
        df2["article"]  = df[article_col].astype(str).str.strip()
        df2["prix"]     = pd.to_numeric(df[prix_col], errors="coerce")
        df2["quantite"] = pd.to_numeric(df[qte_col], errors="coerce") if qte_col else 1.0
        df2["source"]   = source
        df2["fichier"]  = path.name

        # Nettoyage
        df2 = df2.dropna(subset=["date", "prix"])
        df2 = df2[df2["prix"] > 0]
        df2 = df2[df2["article"].str.len() > 0]
        df2["quantite"] = df2["quantite"].fillna(1.0)
        df2["date"]     = df2["date"].dt.date  # garder juste la date (pas l'heure)

        frames.append(df2)
        logger.info("Chargé %s — feuille '%s' : %d lignes valides", path.name, sheet, len(df2))

    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()


def load_all_excel(data_dir: Path = DATA_DIR) -> dict[str, pd.DataFrame]:
    """
    Charge tous les fichiers Excel du dossier data/.
    Retourne un dict : {"achat": DataFrame, "vente": DataFrame}
    """
    result: dict[str, list[pd.DataFrame]] = {"achat": [], "vente": []}

    if not data_dir.exists():
        logger.warning("Dossier data/ introuvable : %s", data_dir)
        return {"achat": pd.DataFrame(), "vente": pd.DataFrame()}

    # Glob insensible à la casse : .xls, .xlsx, .XLS, .XLSX …
    xl_files = sorted(
        {f for f in data_dir.iterdir()
         if f.is_file() and f.suffix.lower() in (".xls", ".xlsx", ".xlsm", ".xlsb")}
    )
    for f in xl_files:
        name_lower = f.stem.lower()
        if "vent" in name_lower:
            source: Literal["achat", "vente"] = "vente"
        else:
            source = "achat"  # par défaut tout est traité comme achat
        df = load_excel_file_cached(f, source=source)
        if not df.empty:
            result[source].append(df)

    return {
        "achat": pd.concat(result["achat"], ignore_index=True) if result["achat"] else pd.DataFrame(),
        "vente": pd.concat(result["vente"], ignore_index=True) if result["vente"] else pd.DataFrame(),
    }


def get_article_history_from_excel(
    keyword: str,
    data_dir: Path = DATA_DIR,
    source: Literal["achat", "vente", "both"] = "achat",
) -> list[dict]:
    """
    Retourne l'historique de prix pour un article donné (recherche partielle insensible à la casse)
    depuis les fichiers Excel.
    Résultat : liste de dicts {date, prix, quantite, source}
    """
    all_data = load_all_excel(data_dir)
    frames = []
    if source in ("achat", "both") and not all_data["achat"].empty:
        frames.append(all_data["achat"])
    if source in ("vente", "both") and not all_data["vente"].empty:
        frames.append(all_data["vente"])

    if not frames:
        return []

    df = pd.concat(frames, ignore_index=True)
    mask = df["article"].str.contains(keyword, case=False, na=False)
    if not mask.any():
        # Essai avec chaque mot du keyword
        for word in keyword.split():
            if len(word) >= 3:
                mask = mask | df["article"].str.contains(word, case=False, na=False)

    matched = df[mask].copy()
    if matched.empty:
        return []

    matched = matched.sort_values("date")
    return [
        {
            "date": str(row["date"]),
            "prix": float(row["prix"]),
            "quantite": float(row["quantite"]),
            "source": row["source"],
        }
        for _, row in matched.iterrows()
    ]


def get_excel_articles_summary(data_dir: Path = DATA_DIR) -> list[dict]:
    """
    Retourne la liste des articles trouvés dans les fichiers Excel
    avec leur nombre de lignes et prix moyen.
    """
    all_data = load_all_excel(data_dir)
    df = all_data["achat"]
    if df.empty:
        return []

    summary = (
        df.groupby("article")
        .agg(nb_achats=("prix", "count"), prix_moyen=("prix", "mean"))
        .reset_index()
        .sort_values("nb_achats", ascending=False)
    )
    return [
        {
            "designation": row["article"],
            "nbAchats": int(row["nb_achats"]),
            "prixMoyenRecent": round(float(row["prix_moyen"]), 3),
            "source": "excel",
        }
        for _, row in summary.iterrows()
    ]


def merge_histories(db_history: list[dict], excel_history: list[dict]) -> list[dict]:
    """
    Fusionne l'historique base de données et Excel.
    - Déduplique par date (garde la valeur DB en priorité si même date).
    - Trie par date croissante.
    """
    if not excel_history:
        return db_history
    if not db_history:
        return excel_history

    # Convertir en DataFrame pour faciliter la fusion
    df_db    = pd.DataFrame(db_history)
    df_excel = pd.DataFrame(excel_history)

    # Normaliser les dates
    df_db["date"]    = pd.to_datetime(df_db["date"]).dt.date.astype(str)
    df_excel["date"] = pd.to_datetime(df_excel["date"]).dt.date.astype(str)

    # DB a priorité : concat puis drop_duplicates en gardant le premier (DB)
    merged = pd.concat([df_db, df_excel], ignore_index=True)
    merged = merged.drop_duplicates(subset=["date"], keep="first")
    merged = merged.sort_values("date").reset_index(drop=True)

    return merged[["date", "prix", "quantite"]].to_dict(orient="records")
