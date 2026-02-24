package com.poly.dindor.repository;

import com.poly.dindor.entity.Fournisseur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FournisseurRepository extends JpaRepository<Fournisseur, Long> {

    Optional<Fournisseur> findByMatricule(String matricule);

    boolean existsByMatricule(String matricule);
}

