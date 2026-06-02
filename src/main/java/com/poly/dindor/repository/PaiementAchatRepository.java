package com.poly.dindor.repository;

import com.poly.dindor.entity.PaiementAchat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface PaiementAchatRepository extends JpaRepository<PaiementAchat, Long> {

    @Query("""
        SELECT p FROM PaiementAchat p
        JOIN FETCH p.factureAchat f
        JOIN FETCH f.fournisseur
        WHERE p.sousMode = com.poly.dindor.entity.PaiementAchat.SousMode.ACOMPTE_TRAITE
          AND p.dateEcheance BETWEEN :today AND :limite
        ORDER BY p.dateEcheance ASC
        """)
    List<PaiementAchat> findTraitesEcheantDans(@Param("today") LocalDate today,
                                                @Param("limite") LocalDate limite);
}
