package com.poly.dindor.repository;

import com.poly.dindor.entity.Vehicule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehiculeRepository extends JpaRepository<Vehicule, Long> {

    List<Vehicule> findByActifTrueOrderByImmatriculationAsc();

    List<Vehicule> findAllByOrderByImmatriculationAsc();
}
