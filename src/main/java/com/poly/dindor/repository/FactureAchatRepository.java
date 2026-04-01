package com.poly.dindor.repository;

import com.poly.dindor.entity.FactureAchat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FactureAchatRepository extends JpaRepository<FactureAchat, Long> {

    @Query("SELECT f FROM FactureAchat f LEFT JOIN FETCH f.lignes WHERE f.id = :id")
    Optional<FactureAchat> findByIdWithLignes(@Param("id") Long id);

    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(numero_facture, 5) AS UNSIGNED)), 0) FROM facture_achat WHERE numero_facture LIKE :prefix", nativeQuery = true)
    long findMaxSeqForYearPrefix(@Param("prefix") String prefix);

    boolean existsByNumeroFacture(String numeroFacture);

    @Query("SELECT f FROM FactureAchat f JOIN FETCH f.fournisseur ORDER BY f.dateFacture DESC, f.id DESC")
    List<FactureAchat> findAllOrdered();
}
