package com.poly.dindor.repository;

import com.poly.dindor.entity.BonLivraison;
import com.poly.dindor.entity.PaiementVente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BonLivraisonRepository extends JpaRepository<BonLivraison, Long> {

    @Query("SELECT b FROM BonLivraison b LEFT JOIN FETCH b.paiement " +
           "ORDER BY b.dateBL DESC, b.id DESC")
    List<BonLivraison> findAllOrdered();

    @Query("SELECT b FROM BonLivraison b LEFT JOIN FETCH b.paiement " +
           "WHERE b.dateBL >= :dateDebut AND b.dateBL <= :dateFin " +
           "ORDER BY b.dateBL DESC, b.id DESC")
    List<BonLivraison> findFilteredByDate(
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin")   LocalDate dateFin);

    @Query("SELECT b FROM BonLivraison b LEFT JOIN FETCH b.paiement " +
           "WHERE b.dateBL >= :dateDebut AND b.dateBL <= :dateFin " +
           "AND b.paiement.modePaiement = :mode " +
           "ORDER BY b.dateBL DESC, b.id DESC")
    List<BonLivraison> findFilteredByDateAndMode(
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin")   LocalDate dateFin,
            @Param("mode")      PaiementVente.ModePaiement mode);

    @Query("SELECT b FROM BonLivraison b LEFT JOIN FETCH b.lignes LEFT JOIN FETCH b.paiement WHERE b.id = :id")
    Optional<BonLivraison> findByIdWithLignes(@Param("id") Long id);

    boolean existsByNumeroBL(String numeroBL);

    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(numero_bl FROM 7) AS INTEGER)), 0) " +
                   "FROM bon_livraison WHERE numero_bl LIKE :prefix", nativeQuery = true)
    long findMaxSeqForPrefix(@Param("prefix") String prefix);

    @Query("SELECT b FROM BonLivraison b LEFT JOIN FETCH b.lignes LEFT JOIN FETCH b.paiement " +
           "WHERE b.client.id = :clientId ORDER BY b.dateBL DESC, b.id DESC")
    List<BonLivraison> findByClientId(@Param("clientId") Long clientId);

    @Query(value = "SELECT l.prix_unitaire_ht FROM bon_livraison_ligne l " +
                   "JOIN bon_livraison b ON b.id = l.bon_livraison_id " +
                   "WHERE l.code_article = :code " +
                   "ORDER BY b.date_bl DESC, b.id DESC LIMIT 1", nativeQuery = true)
    Optional<BigDecimal> findLastPriceByCodeArticle(@Param("code") String code);

    @Query("""
        SELECT b.dateBL, l.designation, l.quantite
        FROM BonLivraison b JOIN b.lignes l
        WHERE LOWER(l.designation) LIKE LOWER(CONCAT('%', :keyword, '%'))
        AND b.dateBL >= :depuis
        ORDER BY b.dateBL ASC
        """)
    List<Object[]> findSalesHistoryByDesignation(
            @Param("keyword") String keyword,
            @Param("depuis") LocalDate depuis);

    @Query("SELECT b FROM BonLivraison b LEFT JOIN FETCH b.lignes " +
           "WHERE b.dateBL >= :dateDebut AND b.dateBL <= :dateFin")
    List<BonLivraison> findWithLignesForPeriod(
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin")   LocalDate dateFin);

    @Query("SELECT l.designation, COUNT(DISTINCT b.id), SUM(l.quantite), AVG(l.prixUnitaireHT) " +
           "FROM BonLivraison b JOIN b.lignes l " +
           "WHERE TRIM(l.designation) <> '' " +
           "GROUP BY l.designation ORDER BY SUM(l.quantite) DESC")
    List<Object[]> findDistinctDesignationsWithSalesStats();

    @Query(value = "SELECT EXTRACT(MONTH FROM date_bl)::int as mois, " +
                   "COALESCE(SUM(net_a_payer), 0) as ca, COUNT(*) as nb_bons " +
                   "FROM bon_livraison WHERE EXTRACT(YEAR FROM date_bl)::int = :annee " +
                   "GROUP BY mois ORDER BY mois", nativeQuery = true)
    List<Object[]> findCaMensuel(@Param("annee") int annee);

    @Query(value = "SELECT COALESCE(c.nom, b.client_nom, 'Divers') as nom, " +
                   "COALESCE(SUM(b.net_a_payer), 0) as ca, COUNT(b.id) as nb_bons " +
                   "FROM bon_livraison b LEFT JOIN clients c ON c.id = b.client_id " +
                   "WHERE b.date_bl >= :dateDebut AND b.date_bl <= :dateFin " +
                   "GROUP BY COALESCE(c.nom, b.client_nom, 'Divers') ORDER BY ca DESC LIMIT :lim", nativeQuery = true)
    List<Object[]> findTopClients(@Param("dateDebut") LocalDate dateDebut,
                                  @Param("dateFin")   LocalDate dateFin,
                                  @Param("lim")       int lim);

    @Query(value = "SELECT TRIM(l.designation) as designation, " +
                   "COALESCE(SUM(l.quantite), 0) as qty, COALESCE(SUM(l.total_ht), 0) as ca " +
                   "FROM bon_livraison_ligne l JOIN bon_livraison b ON b.id = l.bon_livraison_id " +
                   "WHERE b.date_bl >= :dateDebut AND b.date_bl <= :dateFin " +
                   "AND TRIM(l.designation) <> '' " +
                   "GROUP BY TRIM(l.designation) ORDER BY qty DESC LIMIT 10", nativeQuery = true)
    List<Object[]> findTopArticles(@Param("dateDebut") LocalDate dateDebut,
                                   @Param("dateFin")   LocalDate dateFin);

    /** Top articles achetés par un client (tri par quantité totale décroissante). */
    @Query(value = """
        SELECT COALESCE(l.code_article, ''), TRIM(l.designation), COALESCE(l.unite, ''),
               COALESCE(SUM(l.quantite), 0),
               COUNT(DISTINCT b.id),
               CASE WHEN SUM(l.quantite) > 0 THEN COALESCE(SUM(l.total_ht), 0) / SUM(l.quantite) ELSE 0 END
        FROM bon_livraison_ligne l
        JOIN bon_livraison b ON b.id = l.bon_livraison_id
        WHERE b.client_id = :clientId AND TRIM(l.designation) <> ''
        GROUP BY COALESCE(l.code_article, ''), TRIM(l.designation), COALESCE(l.unite, '')
        ORDER BY SUM(l.quantite) DESC
        LIMIT :lim
        """, nativeQuery = true)
    List<Object[]> findTopArticlesByClient(@Param("clientId") Long clientId, @Param("lim") int lim);

    /** Lignes d'un client sur une période (pour le rapport pivot). */
    @Query("""
        SELECT b.dateBL, b.numeroBL, l.designation, l.quantite, l.prixUnitaireHT, l.totalHT
        FROM BonLivraison b JOIN b.lignes l
        WHERE b.client.id = :clientId
          AND b.dateBL >= :dateDebut AND b.dateBL <= :dateFin
          AND TRIM(l.designation) <> ''
        ORDER BY b.dateBL ASC, b.id ASC, l.ordre ASC
        """)
    List<Object[]> findLignesByClientAndPeriode(
            @Param("clientId")  Long clientId,
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin")   LocalDate dateFin);

    @Query(value = "SELECT COUNT(*) as total, " +
                   "SUM(CASE WHEN etat_paiement = 'PAYE' THEN 1 ELSE 0 END) as payes, " +
                   "SUM(CASE WHEN etat_paiement = 'PARTIEL' THEN 1 ELSE 0 END) as partiels, " +
                   "SUM(CASE WHEN etat_paiement = 'EN_ATTENTE' THEN 1 ELSE 0 END) as en_attente, " +
                   "COALESCE(SUM(net_a_payer), 0) as montant_total, " +
                   "COALESCE(SUM(CASE WHEN etat_paiement = 'PAYE' THEN net_a_payer ELSE 0 END), 0) as montant_recouvre " +
                   "FROM bon_livraison WHERE date_bl >= :dateDebut AND date_bl <= :dateFin", nativeQuery = true)
    Object[] findRecouvrementStats(@Param("dateDebut") LocalDate dateDebut,
                                   @Param("dateFin")   LocalDate dateFin);
}
