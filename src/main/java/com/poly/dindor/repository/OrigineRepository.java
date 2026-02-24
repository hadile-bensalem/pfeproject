package com.poly.dindor.repository;

import com.poly.dindor.entity.Origine;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrigineRepository extends JpaRepository<Origine, Long> {
    boolean existsByCode(Integer code);
}
