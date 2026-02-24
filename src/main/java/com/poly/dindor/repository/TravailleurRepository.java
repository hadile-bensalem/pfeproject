package com.poly.dindor.repository;

import com.poly.dindor.entity.Travailleur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TravailleurRepository extends JpaRepository<Travailleur, Long> {

    Optional<Travailleur> findByCin(String cin);

    boolean existsByCin(String cin);
}
