"""
Calendrier tunisien — Données exactes codées en dur pour 2025-2027.
Utilisé par le modèle GBR pour les features saisonnières avicoles.
"""
from __future__ import annotations

from datetime import date, timedelta

# ── Ramadan (dates exactes par année) ─────────────────────────────────────────
RAMADAN_PERIODS = [
    (date(2025, 3, 1),  date(2025, 3, 30)),
    (date(2026, 2, 18), date(2026, 3, 19)),
    (date(2027, 2, 8),  date(2027, 3, 9)),
]

# ── Aïd el-Fitr (3 jours autour) ──────────────────────────────────────────────
AID_FITR_PERIODS = [
    (date(2025, 3, 30), date(2025, 4, 3)),
    (date(2026, 3, 20), date(2026, 3, 24)),
    (date(2027, 3, 10), date(2027, 3, 14)),
]

# ── Aïd el-Adha (5 jours autour) ──────────────────────────────────────────────
AID_ADHA_PERIODS = [
    (date(2025, 6, 6),  date(2025, 6, 11)),
    (date(2026, 5, 27), date(2026, 6, 1)),
    (date(2027, 5, 17), date(2027, 5, 22)),
]

# ── Jours fériés nationaux tunisiens (fixes chaque année) ─────────────────────
FERIES_FIXES = [
    (1, 1),   # Nouvel An
    (3, 20),  # Fête de l'Indépendance
    (4, 9),   # Journée des Martyrs
    (5, 1),   # Fête du Travail
    (7, 25),  # Fête de la République
    (8, 13),  # Fête de la Femme
    (10, 15), # Fête de l'Évacuation
    (12, 17), # Fête de la Révolution
]

# ── Températures normales de Tunis (°C, moyennes mensuelles) ─────────────────
TEMP_NORMALES = {
    1: 11, 2: 12, 3: 14, 4: 17, 5: 21, 6: 26,
    7: 29, 8: 29, 9: 26, 10: 21, 11: 16, 12: 12,
}

# ── Facteurs saisonniers prix avicoles tunisiens ───────────────────────────────
SAISON_FACTORS = {
    1: 1.02, 2: 1.03, 3: 1.10, 4: 1.12, 5: 1.05,
    6: 1.08, 7: 1.15, 8: 1.13, 9: 1.06, 10: 1.03,
    11: 1.01, 12: 1.04,
}
# Moyenne de référence précalculée une seule fois
REF_FACTOR = sum(SAISON_FACTORS.values()) / 12  # ≈ 1.069


def _to_date(date_val) -> date:
    """Normalise n'importe quel objet date/datetime/Timestamp vers datetime.date."""
    if isinstance(date_val, date) and not hasattr(date_val, 'hour'):
        return date_val
    if hasattr(date_val, 'date') and callable(date_val.date):
        return date_val.date()
    return date_val


def is_in_period(date_val, periods: list[tuple]) -> bool:
    """Vérifie si une date est dans une liste de périodes (début, fin)."""
    d = _to_date(date_val)
    for start, end in periods:
        if start <= d <= end:
            return True
    return False


def get_event_features(date_val) -> dict:
    """
    Retourne les features externes pour une date donnée.
    Utilisé pour l'entraînement ET la prédiction récursive des dates futures.
    Retourne exactement 11 clés numériques.
    """
    d = _to_date(date_val)
    m = d.month

    # Vacances scolaires : hiver (2e sem. janvier), printemps (1e sem. avril),
    # automne (3e sem. octobre) — été géré séparément
    is_vac_hiver = (m == 1  and 13 <= d.day <= 20)
    is_vac_print = (m == 4  and 1  <= d.day <= 8)
    is_vac_aut   = (m == 10 and 18 <= d.day <= 25)
    is_vac_scol  = int(is_vac_hiver or is_vac_print or is_vac_aut)

    is_ferie = int(any(m == mm and d.day == dd for mm, dd in FERIES_FIXES))
    temp     = TEMP_NORMALES[m]

    return {
        'is_ramadan'      : int(is_in_period(d, RAMADAN_PERIODS)),
        'is_aid_fitr'     : int(is_in_period(d, AID_FITR_PERIODS)),
        'is_aid_adha'     : int(is_in_period(d, AID_ADHA_PERIODS)),
        'is_ferie'        : is_ferie,
        'is_vacances_ete' : int(m in (7, 8)),
        'is_vacances_scol': is_vac_scol,
        'is_chaleur'      : int(m in (6, 7, 8, 9) and temp >= 22),
        'is_grand_froid'  : int(temp <= 13),
        'is_fetes_fin'    : int(m == 12),
        'temp_normale'    : float(temp),
        'facteur_saison'  : SAISON_FACTORS[m] / REF_FACTOR,
    }


def get_periode_label(date_val) -> str:
    """
    Retourne le label textuel de la période pour affichage.
    Priorité : Ramadan > Aïd el-Fitr > Aïd el-Adha > Vacances été >
               Chaleur estivale > Fêtes fin d'année > Vacances scolaires >
               Jour férié > Standard.
    """
    d = _to_date(date_val)
    m = d.month

    if is_in_period(d, RAMADAN_PERIODS):
        return "Ramadan"
    if is_in_period(d, AID_FITR_PERIODS):
        return "Aïd el-Fitr"
    if is_in_period(d, AID_ADHA_PERIODS):
        return "Aïd el-Adha"
    if m in (7, 8):
        return "Vacances été"
    if m in (6, 7, 8, 9) and TEMP_NORMALES[m] >= 22:
        return "Chaleur estivale"
    if m == 12:
        return "Fêtes fin d'année"
    if (m == 1 and 13 <= d.day <= 20) or (m == 4 and 1 <= d.day <= 8) or \
       (m == 10 and 18 <= d.day <= 25):
        return "Vacances scolaires"
    if any(m == mm and d.day == dd for mm, dd in FERIES_FIXES):
        return "Jour férié"
    return "Standard"


def apply_seasonal_correction(prix_predit: float, target_date) -> tuple:
    """
    Applique la correction saisonnière métier sur le prix ML brut.

    Calcul :
      factor   = SAISON_FACTORS[mois]
      relative = factor / REF_FACTOR
      prix_corrige = prix_predit * relative

    Retourne : (prix_corrige, periode_label, relative_factor)
    """
    d = _to_date(target_date)
    factor        = SAISON_FACTORS[d.month]
    relative      = factor / REF_FACTOR
    prix_corrige  = prix_predit * relative
    periode_label = get_periode_label(d)
    return prix_corrige, periode_label, relative


# Alias de compatibilité avec l'ancienne interface
def get_current_period_label(d) -> str:
    """Alias vers get_periode_label pour compatibilité."""
    return get_periode_label(d)
