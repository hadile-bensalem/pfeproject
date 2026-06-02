package com.poly.dindor.repository;

import com.poly.dindor.entity.FactureClient;
import com.poly.dindor.entity.PaiementFactureClient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FactureClientRepository extends JpaRepository<FactureClient, Long> {

    @Query("SELECT fc FROM FactureClient fc LEFT JOIN FETCH fc.lignes LEFT JOIN FETCH fc.paiement ORDER BY fc.dateFacture DESC, fc.id DESC")
    List<FactureClient> findAllOrdered();

    // ── Factures (typeDocument=FACTURE ou NULL avec numéro non-BL) ───────────
    @Query("SELECT fc FROM FactureClient fc LEFT JOIN FETCH fc.lignes LEFT JOIN FETCH fc.paiement WHERE fc.dateFacture >= :dateDebut AND fc.dateFacture <= :dateFin AND (fc.typeDocument = com.poly.dindor.entity.FactureClient.TypeDocument.FACTURE OR (fc.typeDocument IS NULL AND fc.numeroFacture NOT LIKE 'BL%')) ORDER BY fc.dateFacture DESC, fc.id DESC")
    List<FactureClient> findFacturesByDate(
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin")   LocalDate dateFin);

    @Query("SELECT fc FROM FactureClient fc LEFT JOIN FETCH fc.lignes LEFT JOIN FETCH fc.paiement WHERE fc.dateFacture >= :dateDebut AND fc.dateFacture <= :dateFin AND (fc.typeDocument = com.poly.dindor.entity.FactureClient.TypeDocument.FACTURE OR (fc.typeDocument IS NULL AND fc.numeroFacture NOT LIKE 'BL%')) AND fc.paiement.modePaiement = :mode ORDER BY fc.dateFacture DESC, fc.id DESC")
    List<FactureClient> findFacturesByDateAndMode(
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin")   LocalDate dateFin,
            @Param("mode")      PaiementFactureClient.ModePaiement mode);

    // ── Bons de Livraison (typeDocument=BON_LIVRAISON ou NULL avec numéro BL%) ──
    @Query("SELECT fc FROM FactureClient fc LEFT JOIN FETCH fc.lignes LEFT JOIN FETCH fc.paiement WHERE fc.dateFacture >= :dateDebut AND fc.dateFacture <= :dateFin AND (fc.typeDocument = com.poly.dindor.entity.FactureClient.TypeDocument.BON_LIVRAISON OR (fc.typeDocument IS NULL AND fc.numeroFacture LIKE 'BL%')) ORDER BY fc.dateFacture DESC, fc.id DESC")
    List<FactureClient> findBLsByDate(
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin")   LocalDate dateFin);

    @Query("SELECT fc FROM FactureClient fc LEFT JOIN FETCH fc.lignes LEFT JOIN FETCH fc.paiement WHERE fc.dateFacture >= :dateDebut AND fc.dateFacture <= :dateFin AND (fc.typeDocument = com.poly.dindor.entity.FactureClient.TypeDocument.BON_LIVRAISON OR (fc.typeDocument IS NULL AND fc.numeroFacture LIKE 'BL%')) AND fc.paiement.modePaiement = :mode ORDER BY fc.dateFacture DESC, fc.id DESC")
    List<FactureClient> findBLsByDateAndMode(
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin")   LocalDate dateFin,
            @Param("mode")      PaiementFactureClient.ModePaiement mode);

    @Query("SELECT fc FROM FactureClient fc LEFT JOIN FETCH fc.lignes LEFT JOIN FETCH fc.paiement WHERE fc.id = :id")
    Optional<FactureClient> findByIdWithLignes(@Param("id") Long id);

    boolean existsByNumeroFacture(String numeroFacture);

    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(numero_facture, LENGTH(:prefix)+1) AS INTEGER)), 0) FROM facture_client WHERE numero_facture LIKE :prefix", nativeQuery = true)
    long findMaxSeqForPrefix(@Param("prefix") String prefix);

    @Query("SELECT fc FROM FactureClient fc LEFT JOIN FETCH fc.lignes LEFT JOIN FETCH fc.paiement WHERE fc.dateFacture >= :dateDebut AND fc.dateFacture <= :dateFin")
    List<FactureClient> findWithLignesForPeriod(
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin")   LocalDate dateFin);

    @Query(value = """
        SELECT COALESCE(l.code_article, ''), TRIM(l.designation), COALESCE(l.unite, ''),
               COALESCE(SUM(l.quantite), 0), COUNT(DISTINCT f.id),
               CASE WHEN SUM(l.quantite) > 0 THEN COALESCE(SUM(l.total_ht), 0) / SUM(l.quantite) ELSE 0 END
        FROM facture_client_ligne l JOIN facture_client f ON f.id = l.facture_client_id
        WHERE f.client_id = :clientId AND TRIM(l.designation) <> ''
        GROUP BY COALESCE(l.code_article, ''), TRIM(l.designation), COALESCE(l.unite, '')
        ORDER BY SUM(l.quantite) DESC LIMIT :lim
        """, nativeQuery = true)
    List<Object[]> findTopArticlesByClient(@Param("clientId") Long clientId, @Param("lim") int lim);

    @Query("""
        SELECT f.dateFacture, f.numeroFacture, l.designation, l.quantite, l.prixUnitaireHT, l.totalHT
        FROM FactureClient f JOIN f.lignes l
        WHERE f.client.id = :clientId AND f.dateFacture >= :dateDebut AND f.dateFacture <= :dateFin
          AND TRIM(l.designation) <> ''
        ORDER BY f.dateFacture ASC, f.id ASC, l.ordre ASC
        """)
    List<Object[]> findLignesByClientAndPeriode(
            @Param("clientId")  Long clientId,
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin")   LocalDate dateFin);

    @Query(value = "SELECT prix_unitaire_ht FROM facture_client_ligne WHERE code_article = :code ORDER BY id DESC LIMIT 1", nativeQuery = true)
    Optional<BigDecimal> findLastPriceByCodeArticle(@Param("code") String code);
}
