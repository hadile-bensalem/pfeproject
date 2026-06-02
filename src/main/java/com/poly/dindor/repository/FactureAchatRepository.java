package com.poly.dindor.repository;

import com.poly.dindor.entity.FactureAchat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FactureAchatRepository extends JpaRepository<FactureAchat, Long> {

    @Query("SELECT f FROM FactureAchat f LEFT JOIN FETCH f.lignes LEFT JOIN FETCH f.paiement WHERE f.id = :id")
    Optional<FactureAchat> findByIdWithLignes(@Param("id") Long id);

    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(numero_facture FROM 5) AS INTEGER)), 0) FROM facture_achat WHERE numero_facture LIKE :prefix", nativeQuery = true)
    long findMaxSeqForYearPrefix(@Param("prefix") String prefix);

    boolean existsByNumeroFacture(String numeroFacture);

    @Query("SELECT f FROM FactureAchat f JOIN FETCH f.fournisseur LEFT JOIN FETCH f.paiement ORDER BY f.dateFacture DESC, f.id DESC")
    List<FactureAchat> findAllOrdered();

    /** Historique des prix par article (désignation partielle, insensible à la casse). */
    @Query("""
        SELECT f.dateFacture, l.designation, l.prixUnitaireHT, l.quantite
        FROM FactureAchat f JOIN f.lignes l
        WHERE LOWER(l.designation) LIKE LOWER(CONCAT('%', :keyword, '%'))
        ORDER BY f.dateFacture ASC
        """)
    List<Object[]> findPriceHistoryByDesignation(@Param("keyword") String keyword);

    /** Liste des désignations distinctes avec nombre d'achats et prix moyen récent. */
    @Query("""
        SELECT l.designation, COUNT(l), AVG(l.prixUnitaireHT)
        FROM FactureAchat f JOIN f.lignes l
        GROUP BY l.designation
        ORDER BY COUNT(l) DESC
        """)
    List<Object[]> findDistinctDesignationsWithStats();

    /** Toutes les factures validées d'un fournisseur, triées par date croissante. */
    @Query("SELECT f FROM FactureAchat f LEFT JOIN FETCH f.paiement WHERE f.fournisseur.id = :fournisseurId AND f.statut = :statut ORDER BY f.dateFacture ASC, f.id ASC")
    List<FactureAchat> findValideesByFournisseur(@Param("fournisseurId") Long fournisseurId,
                                                  @Param("statut") FactureAchat.StatutFacture statut);

    /** Toutes les factures validées groupées par fournisseur (pour l'état global). */
    @Query("SELECT f FROM FactureAchat f JOIN FETCH f.fournisseur LEFT JOIN FETCH f.paiement WHERE f.statut = :statut")
    List<FactureAchat> findAllValidees(@Param("statut") FactureAchat.StatutFacture statut);

    /** Toutes les factures non-BROUILLON d'un fournisseur (VALIDEE + PAYEE), triées par date. */
    @Query("SELECT f FROM FactureAchat f LEFT JOIN FETCH f.paiement WHERE f.fournisseur.id = :fournisseurId AND f.statut <> :excludeStatut ORDER BY f.dateFacture ASC, f.id ASC")
    List<FactureAchat> findNonBrouillonByFournisseur(@Param("fournisseurId") Long fournisseurId,
                                                      @Param("excludeStatut") FactureAchat.StatutFacture excludeStatut);

    /** Toutes les factures non-BROUILLON globalement (pour l'état fournisseurs). */
    @Query("SELECT f FROM FactureAchat f JOIN FETCH f.fournisseur LEFT JOIN FETCH f.paiement WHERE f.statut <> :excludeStatut")
    List<FactureAchat> findAllNonBrouillon(@Param("excludeStatut") FactureAchat.StatutFacture excludeStatut);
}
