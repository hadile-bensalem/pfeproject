package com.poly.dindor.repository;

import com.poly.dindor.entity.FichePaie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FichePaieRepository extends JpaRepository<FichePaie, Long> {

    List<FichePaie> findByEmployeIdOrderByAnneeDescMoisDesc(Long employeId);

    Optional<FichePaie> findByEmployeIdAndMoisAndAnnee(Long employeId, int mois, int annee);

    boolean existsByEmployeIdAndMoisAndAnnee(Long employeId, int mois, int annee);

    @Query("SELECT COUNT(f) FROM FichePaie f WHERE f.annee = :annee AND f.mois = :mois")
    long countByMoisAnnee(@Param("mois") int mois, @Param("annee") int annee);

    @Query("SELECT f FROM FichePaie f WHERE f.annee = :annee AND f.mois = :mois ORDER BY f.employe.nom")
    List<FichePaie> findByMoisAnnee(@Param("mois") int mois, @Param("annee") int annee);
}
