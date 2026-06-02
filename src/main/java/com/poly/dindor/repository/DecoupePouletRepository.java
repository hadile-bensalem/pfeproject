package com.poly.dindor.repository;

import com.poly.dindor.entity.DecoupePoulet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DecoupePouletRepository extends JpaRepository<DecoupePoulet, Long> {

    @Query("SELECT d FROM DecoupePoulet d LEFT JOIN FETCH d.lignes " +
           "WHERE d.dateDecoupe BETWEEN :dateDebut AND :dateFin " +
           "ORDER BY d.dateDecoupe DESC, d.id DESC")
    List<DecoupePoulet> findByPeriodWithLignes(
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin")   LocalDate dateFin);

    @Query("SELECT d FROM DecoupePoulet d LEFT JOIN FETCH d.lignes WHERE d.id = :id")
    Optional<DecoupePoulet> findByIdWithLignes(@Param("id") Long id);
}
