package com.poly.dindor.config;

import com.poly.dindor.entity.Article;
import com.poly.dindor.entity.LotStock;
import com.poly.dindor.repository.ArticleRepository;
import com.poly.dindor.repository.LotStockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Recalcule le PUMP des produits dérivés (chwarma, etc.) à partir des lots
 * existants. Corrige les articles créés avant que StockService calcule le pump
 * des dérivés.
 *
 * Formule : pump_dérivé = Σ(qteDeriveRestante × (prixLot / tauxLot)) / Σ(qteDeriveRestante)
 */
@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class PumpRecalcRunner implements ApplicationRunner {

    private final ArticleRepository  articleRepository;
    private final LotStockRepository lotStockRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Article> derives = articleRepository.findAll().stream()
                .filter(a -> a.getCodeArticleSource() != null && !a.getCodeArticleSource().isBlank())
                .toList();

        int updated = 0;
        for (Article derive : derives) {
            List<LotStock> lots = lotStockRepository.findLotsActifsForDerive(derive);
            if (lots.isEmpty()) continue;

            BigDecimal totalQte  = BigDecimal.ZERO;
            BigDecimal totalCout = BigDecimal.ZERO;

            for (LotStock lot : lots) {
                if (lot.getTauxConversion() == null
                        || lot.getTauxConversion().compareTo(BigDecimal.ZERO) == 0
                        || lot.getQteDeriveRestante() == null
                        || lot.getQteDeriveRestante().compareTo(BigDecimal.ZERO) <= 0) continue;

                BigDecimal puDerive = lot.getPrixUnitaire()
                        .divide(lot.getTauxConversion(), 3, RoundingMode.HALF_UP);
                totalQte   = totalQte.add(lot.getQteDeriveRestante());
                totalCout  = totalCout.add(lot.getQteDeriveRestante().multiply(puDerive));
            }

            if (totalQte.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal newPump = totalCout.divide(totalQte, 3, RoundingMode.HALF_UP);
                if (newPump.compareTo(derive.getPump()) != 0) {
                    derive.setPump(newPump);
                    articleRepository.save(derive);
                    updated++;
                    log.info("PumpRecalc : {} ({}) → pump = {}",
                            derive.getDesignation(), derive.getCodeArticle(), newPump);
                }
            }
        }
        if (updated > 0) {
            log.info("PumpRecalcRunner : {} produit(s) dérivé(s) mis à jour.", updated);
        } else {
            log.debug("PumpRecalcRunner : aucun produit dérivé à recalculer.");
        }
    }
}
