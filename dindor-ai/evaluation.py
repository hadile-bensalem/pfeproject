"""
evaluation.py — Walk-forward validation du modèle GBR (Dindor)
==============================================================
Méthode : backtesting temporel (jamais de données futures vues à l'entraînement)

  Pour chaque fold :
    - Entraînement sur l'historique jusqu'à la date t
    - Prédiction à 7j, 15j, 30j
    - Comparaison avec les vrais prix observés après t

Métriques :
    MAE  — Erreur absolue moyenne (DT)
    RMSE — Pénalise les grosses erreurs
    MAPE — Erreur en % (indépendante du niveau de prix)
    DA   — Directional Accuracy (prédit-on la bonne direction ?)

Usage :
    python evaluation.py
    python evaluation.py --article "BLANQUETTE DINDE"
    python evaluation.py --article "POULET PAC C4" --horizons 7 15 --splits 10
"""
from __future__ import annotations

import argparse
import warnings
from datetime import timedelta

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")


# ─── 1. Chargement ────────────────────────────────────────────────────────────

def load_weekly(article_keyword: str) -> pd.DataFrame:
    """Charge l'historique et agrège par semaine (prix moyen pondéré par quantité)."""
    from data_loader import load_all_excel

    data = load_all_excel()
    df = data["achat"].copy()
    df["date"] = pd.to_datetime(df["date"])

    kw = article_keyword.lower()
    df = df[df["article"].str.lower().str.contains(kw, na=False)]

    if df.empty:
        raise ValueError(f"Aucune donnée pour '{article_keyword}'")

    df = df.sort_values("date").reset_index(drop=True)
    df["week"] = df["date"].dt.to_period("W").dt.start_time

    def wagg(g):
        w = g["quantite"].values
        return pd.Series({
            "prix"    : float(np.average(g["prix"].values,
                                         weights=w if w.sum() > 0 else None)),
            "quantite": float(g["quantite"].sum()),
        })

    weekly = df.groupby("week").apply(wagg, include_groups=False).reset_index()
    weekly = weekly.rename(columns={"week": "date"})
    return weekly.sort_values("date").reset_index(drop=True)


# ─── 2. Métriques ─────────────────────────────────────────────────────────────

def _mae(y_true, y_pred):
    return float(np.mean(np.abs(np.array(y_true) - np.array(y_pred))))

def _rmse(y_true, y_pred):
    return float(np.sqrt(np.mean((np.array(y_true) - np.array(y_pred)) ** 2)))

def _mape(y_true, y_pred):
    yt, yp = np.array(y_true), np.array(y_pred)
    mask = yt > 0
    if mask.sum() == 0:
        return float("nan")
    return float(np.mean(np.abs((yt[mask] - yp[mask]) / yt[mask])) * 100)

def _da(y_true, y_pred, y_last):
    """% de fois où la direction (hausse/baisse vs dernier prix connu) est correcte."""
    yt, yp, yl = np.array(y_true), np.array(y_pred), np.array(y_last)
    real_dir = np.sign(yt - yl)
    pred_dir = np.sign(yp - yl)
    ok    = (real_dir == pred_dir) & (real_dir != 0)
    total = (real_dir != 0).sum()
    return float(ok.sum() / total * 100) if total > 0 else float("nan")


# ─── 3. Walk-forward validation ───────────────────────────────────────────────

def walk_forward(weekly: pd.DataFrame, horizons: list[int],
                 n_splits: int = 8) -> tuple[dict, int, int]:
    """
    Backtesting temporel sur n_splits fenêtres glissantes.
    Utilise predictor.predict() (GBR) comme boîte noire — cohérent avec la prod.
    """
    import predictor  # import local pour éviter les imports circulaires

    n         = len(weekly)
    min_train = max(12, n // 3)
    step      = max(1, (n - min_train) // n_splits)

    results   = {h: {"true": [], "pred": [], "last": [], "folds": []} for h in horizons}
    n_gbr, n_fallback = 0, 0

    print(f"\n  Données : {n} semaines "
          f"({weekly['date'].iloc[0].date()} → {weekly['date'].iloc[-1].date()})")
    print(f"  Fenêtres : {n_splits} | Entraînement min : {min_train} semaines\n")
    print(f"  {'Fold':>4}  {'Split':12}  {'N train':>7}  ", end="")
    for h in horizons:
        print(f"  J+{h:2d} MAPE", end="")
    print()
    print("  " + "-" * 72)

    for fold in range(n_splits):
        split_idx = min_train + fold * step
        if split_idx >= n:
            break

        train            = weekly.iloc[:split_idx]
        last_known_price = float(train["prix"].iloc[-1])

        train_hist = [
            {
                "date"    : str(r["date"].date()),
                "prix"    : float(r["prix"]),
                "quantite": float(r.get("quantite", 1.0)),
            }
            for _, r in train.iterrows()
        ]

        try:
            result   = predictor.predict(train_hist, horizons, article="_eval_")
            pred_pts = result.get("predictions", [])
            modele   = "G" if "GradientBoosting" in result.get("modele", "") else "L"
            if modele == "G":
                n_gbr += 1
            else:
                n_fallback += 1
        except Exception as exc:
            print(f"  [Fold {fold+1}] ERREUR prédiction : {exc}")
            continue

        fold_info  = (f"[{fold+1:2d}{modele}]  "
                      f"{str(train['date'].iloc[-1].date()):12}  {len(train):7d}")
        fold_mapes = []

        for h in horizons:
            # Fenêtre ±3 jours autour de la date cible pour le vrai prix
            t_start = train["date"].iloc[-1] + timedelta(days=h - 3)
            t_end   = train["date"].iloc[-1] + timedelta(days=h + 10)
            future  = weekly[
                (weekly["date"] >= t_start) & (weekly["date"] <= t_end)
            ]
            if future.empty:
                fold_mapes.append(float("nan"))
                continue

            prix_reel = float(future["prix"].mean())
            match = next(
                (p for p in pred_pts if p["horizon_jours"] == h), None
            )
            if match is None:
                fold_mapes.append(float("nan"))
                continue

            prix_predit = float(match["prix_predit"])
            err = (abs(prix_reel - prix_predit) / prix_reel * 100
                   if prix_reel > 0 else float("nan"))
            fold_mapes.append(err)

            results[h]["true"].append(prix_reel)
            results[h]["pred"].append(prix_predit)
            results[h]["last"].append(last_known_price)
            results[h]["folds"].append({
                "fold"       : fold + 1,
                "date_split" : str(train["date"].iloc[-1].date()),
                "prix_reel"  : round(prix_reel, 3),
                "prix_predit": round(prix_predit, 3),
                "err_pct"    : round(err, 2) if not np.isnan(err) else None,
            })

        print(f"  {fold_info}", end="")
        for err in fold_mapes:
            print(f"  {err:8.2f}%" if not np.isnan(err) else f"  {'N/A':>8}", end="")
        print()

    # Métriques globales par horizon
    metrics = {}
    for h in horizons:
        yt, yp, yl = results[h]["true"], results[h]["pred"], results[h]["last"]
        if len(yt) < 2:
            metrics[h] = None
            continue
        metrics[h] = {
            "n_folds": len(yt),
            "MAE"    : round(_mae(yt, yp), 4),
            "RMSE"   : round(_rmse(yt, yp), 4),
            "MAPE"   : round(_mape(yt, yp), 2),
            "DA"     : round(_da(yt, yp, yl), 1),
            "folds"  : results[h]["folds"],
        }

    return metrics, n_gbr, n_fallback


# ─── 4. Rapport ───────────────────────────────────────────────────────────────

def print_report(metrics: dict, horizons: list[int], n_gbr: int, n_fallback: int):
    print("\n" + "=" * 72)
    print("  RAPPORT DE QUALITÉ DU MODÈLE IA — Dind'Or GBR")
    print("=" * 72)
    print(f"  Modèles utilisés : GBR x{n_gbr}   Régression linéaire x{n_fallback}\n")

    print(f"  {'Horizon':>8}  {'MAE (DT)':>10}  {'RMSE (DT)':>10}"
          f"  {'MAPE (%)':>10}  {'DA (%)':>8}  Qualité")
    print("  " + "-" * 72)

    all_mape, all_da = [], []

    for h in horizons:
        m = metrics.get(h)
        if m is None:
            print(f"  {'J+'+str(h):>8}  {'N/A':>10}  {'N/A':>10}"
                  f"  {'N/A':>10}  {'N/A':>8}")
            continue

        mape_v = m["MAPE"]
        da_v   = m["DA"]
        all_mape.append(mape_v)
        if not np.isnan(da_v):
            all_da.append(da_v)

        if mape_v < 5:    qualite = "Excellent"
        elif mape_v < 10: qualite = "Bon"
        elif mape_v < 20: qualite = "Acceptable"
        else:             qualite = "À améliorer"

        print(f"  {'J+'+str(h):>8}  {m['MAE']:>10.4f}  {m['RMSE']:>10.4f}"
              f"  {mape_v:>10.2f}  {da_v:>8.1f}  {qualite}")

    avg_mape = float(np.mean(all_mape)) if all_mape else float("nan")
    avg_da   = float(np.mean(all_da))   if all_da   else float("nan")

    print("\n  " + "=" * 72)
    print(f"  Moyennes globales :  MAPE = {avg_mape:.2f}%   "
          f"Directional Accuracy = {avg_da:.1f}%")
    print("  " + "=" * 72)

    if avg_mape < 10 and avg_da >= 65:
        verdict = "MODÈLE VALIDÉ — Précision suffisante pour les décisions d'achat"
        note    = f"MAPE {avg_mape:.1f}% < 10% et DA {avg_da:.1f}% ≥ 65%."
    elif avg_mape < 20:
        verdict = "MODÈLE ACCEPTABLE — Utilisable avec prudence"
        note    = f"MAPE {avg_mape:.1f}% < 20% : acceptable pour un marché volatile."
    else:
        verdict = "MODÈLE À AMÉLIORER — Données insuffisantes ou marché trop volatil"
        note    = f"MAPE {avg_mape:.1f}% trop élevée. Vérifier la qualité des données."

    print(f"\n  VERDICT : {verdict}")
    print(f"  Détail  : {note}")
    print()
    print("  GUIDE DES MÉTRIQUES :")
    print("  MAE  — Erreur absolue en DT")
    print("  RMSE — Comme MAE, pénalise davantage les grandes erreurs")
    print("  MAPE — Erreur en % : < 10% = bon, < 20% = acceptable, > 20% = insuffisant")
    print("  DA   — Direction Accuracy : > 65% = utile, > 50% = mieux qu'un tirage au sort")
    print()


# ─── 5. Main ──────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Évaluation du modèle GBR — Dindor")
    parser.add_argument("--article",  default="BLANQUETTE DINDE",
                        help="Mot-clé dans le nom de l'article")
    parser.add_argument("--horizons", nargs="+", type=int, default=[7, 15, 30],
                        help="Horizons en jours (défaut: 7 15 30)")
    parser.add_argument("--splits",   type=int, default=8,
                        help="Nombre de fenêtres walk-forward (défaut: 8)")
    args = parser.parse_args()

    print()
    print("=" * 72)
    print("  ÉVALUATION DU MODÈLE IA — Dind'Or")
    print(f"  Article  : {args.article}")
    print(f"  Horizons : {args.horizons} jours")
    print(f"  Méthode  : Walk-forward validation ({args.splits} fenêtres)")
    print("=" * 72)

    try:
        weekly = load_weekly(args.article)
    except ValueError as e:
        print(f"\n  ERREUR : {e}")
        print("  Articles disponibles :")
        from data_loader import load_all_excel
        data = load_all_excel()
        for art in sorted(data["achat"]["article"].unique()):
            print(f"    - {art}")
        return

    print(f"\n  {len(weekly)} semaines chargées pour '{args.article}'")

    if len(weekly) < 15:
        print(f"\n  Pas assez de données ({len(weekly)} sem). Minimum requis : 15.")
        return

    metrics, n_gbr, n_fallback = walk_forward(weekly, args.horizons, args.splits)
    print_report(metrics, args.horizons, n_gbr, n_fallback)


if __name__ == "__main__":
    main()
