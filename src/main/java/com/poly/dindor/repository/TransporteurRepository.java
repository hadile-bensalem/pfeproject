package com.poly.dindor.repository;

import com.poly.dindor.entity.Transporteur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransporteurRepository extends JpaRepository<Transporteur, Long> {

    List<Transporteur> findByActifTrueOrderByNomAsc();

    List<Transporteur> findAllByOrderByNomAsc();
}
