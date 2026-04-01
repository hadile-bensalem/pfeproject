package com.poly.dindor.repository;

import com.poly.dindor.entity.RetenueSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RetenueSourceRepository extends JpaRepository<RetenueSource, Long> {

    /** Charge le certificat avec ses lignes en une seule requête (évite le N+1). */
    @Query("SELECT r FROM RetenueSource r LEFT JOIN FETCH r.lignes WHERE r.id = :id")
    Optional<RetenueSource> findByIdWithLignes(Long id);

    /** Liste tous les certificats d'un fournisseur, triés par date desc. */
    List<RetenueSource> findByFournisseurIdOrderByDateRetenueDesc(Long fournisseurId);

    boolean existsByNumeroDocument(String numeroDocument);
}
