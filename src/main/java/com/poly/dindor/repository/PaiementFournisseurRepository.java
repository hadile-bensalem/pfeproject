package com.poly.dindor.repository;

import com.poly.dindor.entity.PaiementFournisseur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaiementFournisseurRepository extends JpaRepository<PaiementFournisseur, Long> {
    List<PaiementFournisseur> findByFournisseurIdOrderByDatePaiementAsc(Long fournisseurId);
}
