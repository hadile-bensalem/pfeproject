package com.poly.dindor.repository;

import com.poly.dindor.entity.Fournisseur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FournisseurRepository extends JpaRepository<Fournisseur, Long> {

    Optional<Fournisseur> findByMatricule(String matricule);

    Optional<Fournisseur> findFirstByRaisonSocialeIgnoreCase(String raisonSociale);

    List<Fournisseur> findAllByRaisonSocialeIgnoreCase(String raisonSociale);

    boolean existsByMatricule(String matricule);
}

