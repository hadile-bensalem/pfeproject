package com.poly.dindor.repository;

import com.poly.dindor.entity.Article;
import com.poly.dindor.entity.LotStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface LotStockRepository extends JpaRepository<LotStock, Long> {

    boolean existsByArticleOrigine_Id(Long articleId);

    boolean existsByArticleDerive_Id(Long articleId);

    void deleteByArticleOrigine_Id(Long articleId);

    @Modifying
    @Query("UPDATE LotStock l SET l.articleDerive = null, l.tauxConversion = null, "
            + "l.qteDeriveInitiale = null, l.qteDeriveRestante = null "
            + "WHERE l.articleDerive.id = :articleId")
    void clearArticleDeriveByArticleId(@Param("articleId") Long articleId);

    /** Lots actifs pour l'article source — ordre FIFO (date_entree ASC, id ASC). */
    List<LotStock> findByArticleOrigineAndActifTrueOrderByDateEntreeAscIdAsc(Article articleOrigine);

    /** Lots actifs avec dérivé disponible — ordre FIFO. */
    @Query("SELECT l FROM LotStock l " +
           "WHERE l.articleDerive = :article AND l.actif = true AND l.qteDeriveRestante > 0 " +
           "AND l.tauxConversion IS NOT NULL AND l.tauxConversion > 0 " +
           "ORDER BY l.dateEntree ASC, l.id ASC")
    List<LotStock> findLotsActifsForDerive(@Param("article") Article article);

    /** Tous les lots d'un article origine pour consultation (actifs + épuisés). */
    List<LotStock> findByArticleOrigineOrderByDateEntreeDescIdDesc(Article articleOrigine);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM LotStock l WHERE l.factureAchat.id = :factureId")
    void deleteByFactureAchatId(@Param("factureId") Long factureId);

    /** Taux moyen pondéré = Σ(qte_restante × taux) / Σ(qte_restante) sur lots actifs. */
    @Query("SELECT CASE WHEN SUM(l.qteOrigineRestante) = 0 THEN 0 " +
           "ELSE SUM(l.qteOrigineRestante * l.tauxConversion) / SUM(l.qteOrigineRestante) END " +
           "FROM LotStock l " +
           "WHERE l.articleOrigine.id = :articleId " +
           "  AND l.actif = true " +
           "  AND l.tauxConversion IS NOT NULL " +
           "  AND l.qteOrigineRestante > 0")
    BigDecimal getTauxMoyenPondere(@Param("articleId") Long articleId);
}
