package com.poly.dindor.repository;

import com.poly.dindor.entity.Pointage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PointageRepository extends JpaRepository<Pointage, Long> {

    List<Pointage> findByTravailleurIdOrderByDatePointageDesc(Long travailleurId);
}
