package com.poly.dindor.repository;

import com.poly.dindor.entity.Famille;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilleRepository extends JpaRepository<Famille, Long> {
    boolean existsByCode(Integer code);
}
