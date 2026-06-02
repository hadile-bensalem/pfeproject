package com.poly.dindor.service;

import com.poly.dindor.dto.response.*;
import com.poly.dindor.repository.BonLivraisonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final BonLivraisonRepository blRepository;

    private static final String[] MOIS_FR = {
        "", "Janv", "Févr", "Mars", "Avr", "Mai", "Juin",
        "Juil", "Août", "Sept", "Oct", "Nov", "Déc"
    };

    @Transactional(readOnly = true)
    public List<CaMensuelResponse> getCaMensuel(int annee) {
        List<Object[]> rows = blRepository.findCaMensuel(annee);
        Map<Integer, Object[]> byMois = new LinkedHashMap<>();
        for (Object[] r : rows) {
            int mois = ((Number) r[0]).intValue();
            byMois.put(mois, r);
        }
        List<CaMensuelResponse> result = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            Object[] r = byMois.get(m);
            BigDecimal ca = r != null ? new BigDecimal(r[1].toString()).setScale(3, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            long nb = r != null ? ((Number) r[2]).longValue() : 0L;
            result.add(new CaMensuelResponse(m, MOIS_FR[m], ca, nb));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<TopClientResponse> getTopClients(LocalDate dateDebut, LocalDate dateFin) {
        List<Object[]> rows = blRepository.findTopClients(dateDebut, dateFin, 10);
        List<TopClientResponse> result = new ArrayList<>();
        for (Object[] r : rows) {
            String nom = r[0] != null ? r[0].toString() : "—";
            BigDecimal ca = new BigDecimal(r[1].toString()).setScale(3, RoundingMode.HALF_UP);
            long nb = ((Number) r[2]).longValue();
            result.add(new TopClientResponse(nom, ca, nb));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<TopArticleResponse> getTopArticles(LocalDate dateDebut, LocalDate dateFin) {
        List<Object[]> rows = blRepository.findTopArticles(dateDebut, dateFin);
        List<TopArticleResponse> result = new ArrayList<>();
        for (Object[] r : rows) {
            String des = r[0] != null ? r[0].toString() : "—";
            BigDecimal qty = new BigDecimal(r[1].toString()).setScale(3, RoundingMode.HALF_UP);
            BigDecimal ca  = new BigDecimal(r[2].toString()).setScale(3, RoundingMode.HALF_UP);
            result.add(new TopArticleResponse(des, qty, ca));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public RecouvrementStatsResponse getRecouvrement(LocalDate dateDebut, LocalDate dateFin) {
        Object[] r = blRepository.findRecouvrementStats(dateDebut, dateFin);
        if (r == null || r[0] == null) {
            return new RecouvrementStatsResponse(0, 0, 0, 0, BigDecimal.ZERO, BigDecimal.ZERO, 0.0);
        }
        long total     = ((Number) r[0]).longValue();
        long payes     = ((Number) r[1]).longValue();
        long partiels  = ((Number) r[2]).longValue();
        long enAttente = ((Number) r[3]).longValue();
        BigDecimal montantTotal    = new BigDecimal(r[4].toString()).setScale(3, RoundingMode.HALF_UP);
        BigDecimal montantRecouvre = new BigDecimal(r[5].toString()).setScale(3, RoundingMode.HALF_UP);
        double taux = total > 0 ? (payes * 100.0 / total) : 0.0;
        return new RecouvrementStatsResponse(total, payes, partiels, enAttente, montantTotal, montantRecouvre,
                Math.round(taux * 10.0) / 10.0);
    }
}
