"""
Dindor AI — FastAPI Service
Port: 8001
Prédit les prix d'achat de volaille via GradientBoostingRegressor.

Spring Boot (port 8099) envoie POST /predict avec :
  { "article": "...", "history": [...], "horizons": [7, 15, 30] }
"""
from __future__ import annotations

import os
from typing import List, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import predictor

app = FastAPI(
    title="Dind'Or IA — GBR Price Predictor",
    description="Microservice de prédiction des prix d'achat de volaille (marché tunisien)",
    version="2.0.0",
)

ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:8099,http://localhost:4200").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# ── Modèles de données ──────────────────────────────────────────────────────

class HistoriquePoint(BaseModel):
    date: str
    prix: float
    quantite: float


class HistoriqueVentePoint(BaseModel):
    date: str
    designation: Optional[str] = ""
    quantite: float

class PredictionRequest(BaseModel):
    article: str
    history: List[HistoriquePoint]
    horizons: Optional[List[int]] = [7, 15, 30]
    stock_actuel: Optional[float] = 0.0
    stock_minimum: Optional[float] = 0.0
    historique_ventes: Optional[List[HistoriqueVentePoint]] = []
    demande_hebdo_moyenne: Optional[float] = 0.0


class EvaluationRequest(BaseModel):
    article: str
    history: List[HistoriquePoint]
    horizons: Optional[List[int]] = [7, 15, 30]
    n_splits: Optional[int] = 6


# ── Endpoints ───────────────────────────────────────────────────────────────

@app.post("/predict")
async def predict_endpoint(request: PredictionRequest):
    try:
        historique_list = [
            {"date": h.date, "prix": h.prix, "quantite": h.quantite}
            for h in request.history
        ]
        result = predictor.predict(
            historique_list, request.horizons, article=request.article
        )
        result["article"] = request.article

        # Enrichir avec les données de ventes réelles
        result["stock_actuel"]   = request.stock_actuel
        result["stock_minimum"]  = request.stock_minimum
        result["demande_hebdo_moyenne"] = request.demande_hebdo_moyenne

        # Calculer demande hebdo depuis historique_ventes si non fournie
        if request.demande_hebdo_moyenne == 0 and request.historique_ventes:
            total_qte = sum(v.quantite for v in request.historique_ventes)
            result["demande_hebdo_moyenne"] = round(total_qte / 13.0, 3)

        # Quantité à acheter = 4 semaines de demande + stock minimum - stock actuel
        demande = result.get("demande_hebdo_moyenne", 0)
        stock   = request.stock_actuel
        smin    = request.stock_minimum
        qte_acheter = max(0.0, demande * 4 + smin - stock)
        result["quantite_a_acheter"] = round(qte_acheter, 3)
        result["stock_critique"]     = stock < demande or (smin > 0 and stock <= smin)
        result["stock_net"]          = max(0.0, stock - demande)

        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur prédiction : {str(e)}")


@app.post("/evaluate")
async def evaluate_endpoint(request: EvaluationRequest):
    """
    Lance une walk-forward validation sur les données fournies.
    Retourne MAE, RMSE, MAPE, Directional Accuracy pour chaque horizon.
    Destiné à la démonstration (jury PFE) et au monitoring qualité.
    """
    try:
        import numpy as np
        from evaluation import walk_forward, _mae, _rmse, _mape, _da
        import pandas as pd

        # Reconstruire le DataFrame weekly depuis l'historique brut
        records = [
            {"date": pd.Timestamp(h.date), "prix": h.prix, "quantite": h.quantite}
            for h in request.history
        ]
        df = pd.DataFrame(records).sort_values("date").reset_index(drop=True)
        df["week"] = df["date"].dt.to_period("W").dt.start_time

        def wagg(g):
            w = g["quantite"].values
            return pd.Series({
                "prix"    : float(np.average(g["prix"].values,
                                             weights=w if w.sum() > 0 else None)),
                "quantite": float(g["quantite"].sum()),
            })

        weekly = (
            df.groupby("week")
            .apply(wagg, include_groups=False)
            .reset_index()
            .rename(columns={"week": "date"})
            .sort_values("date")
            .reset_index(drop=True)
        )

        if len(weekly) < 15:
            raise ValueError(
                f"Données insuffisantes : {len(weekly)} semaines (minimum 15 requis)"
            )

        horizons          = sorted(set(request.horizons))
        metrics, n_gbr, n_fallback = walk_forward(weekly, horizons, request.n_splits)

        # Construire la réponse JSON
        result = {
            "article"   : request.article,
            "n_semaines": len(weekly),
            "n_splits"  : request.n_splits,
            "n_gbr"     : n_gbr,
            "n_fallback": n_fallback,
            "horizons"  : {},
        }

        all_mape, all_da = [], []
        for h in horizons:
            m = metrics.get(h)
            if m is None:
                result["horizons"][f"J+{h}"] = None
                continue
            result["horizons"][f"J+{h}"] = {
                "MAE_DT"  : m["MAE"],
                "RMSE_DT" : m["RMSE"],
                "MAPE_pct": m["MAPE"],
                "DA_pct"  : m["DA"],
                "n_folds" : m["n_folds"],
                "folds"   : m["folds"],
            }
            all_mape.append(m["MAPE"])
            if not np.isnan(m["DA"]):
                all_da.append(m["DA"])

        avg_mape = float(np.mean(all_mape)) if all_mape else None
        avg_da   = float(np.mean(all_da))   if all_da   else None
        result["moyenne_MAPE_pct"]   = round(avg_mape, 2) if avg_mape else None
        result["moyenne_DA_pct"]     = round(avg_da, 1)   if avg_da   else None

        if avg_mape is not None and avg_da is not None:
            if avg_mape < 10 and avg_da >= 65:
                result["verdict"] = "VALIDÉ"
            elif avg_mape < 20:
                result["verdict"] = "ACCEPTABLE"
            else:
                result["verdict"] = "À_AMÉLIORER"
        else:
            result["verdict"] = "INDÉTERMINÉ"

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur évaluation : {str(e)}")


@app.post("/feature-importances")
async def feature_importances_endpoint(request: PredictionRequest):
    """
    Entraîne le modèle sur l'historique fourni et retourne les feature importances.
    Utile pour analyser quels facteurs influencent le plus les prix.
    """
    try:
        historique_list = [
            {"date": h.date, "prix": h.prix, "quantite": h.quantite}
            for h in request.history
        ]
        result = predictor.predict(
            historique_list, [7], article=request.article
        )
        importances = result.get("feature_importances", {})
        top5 = list(importances.items())[:5]

        return {
            "article"            : request.article,
            "feature_importances": importances,
            "top5_features"      : [
                {"feature": k, "importance": v, "importance_pct": round(v * 100, 1)}
                for k, v in top5
            ],
            "interpretation": _interpret_importances(top5),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur : {str(e)}")


def _interpret_importances(top5: list[tuple]) -> str:
    """Génère une interprétation lisible des features les plus importantes."""
    labels = {
        "lag_1"        : "prix de la semaine précédente",
        "lag_2"        : "prix d'il y a 2 semaines",
        "lag_3"        : "prix d'il y a 3 semaines",
        "lag_4"        : "prix d'il y a 4 semaines",
        "roll_mean_4"  : "moyenne mobile 4 semaines",
        "roll_mean_8"  : "moyenne mobile 8 semaines",
        "roll_std_4"   : "volatilité 4 semaines",
        "prix_change"  : "variation de prix récente",
        "t"            : "tendance linéaire long terme",
        "month"        : "mois de l'année",
        "week_num"     : "numéro de semaine",
        "is_ramadan"   : "période Ramadan",
        "is_aid_fitr"  : "période Aïd el-Fitr",
        "is_aid_adha"  : "période Aïd el-Adha",
        "is_ferie"     : "jour férié",
        "is_vacances_ete" : "vacances d'été",
        "is_vacances_scol": "vacances scolaires",
        "is_chaleur"   : "chaleur estivale",
        "is_grand_froid": "grand froid hivernal",
        "is_fetes_fin" : "fêtes de fin d'année",
        "temp_normale" : "température normale du mois",
        "facteur_saison": "facteur saisonnier avicole",
    }
    parts = [
        f"{labels.get(k, k)} ({v*100:.1f}%)"
        for k, v in top5
    ]
    return f"Les 5 facteurs les plus influents : {', '.join(parts)}."


@app.get("/health")
async def health():
    """Vérification de l'état du service IA."""
    return {
        "status" : "ok",
        "modele" : "GradientBoostingRegressor",
        "version": "2.0.0",
        "cache"  : len(predictor._model_cache),
    }
