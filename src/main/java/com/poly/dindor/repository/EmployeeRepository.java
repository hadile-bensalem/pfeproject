package com.poly.dindor.repository;

import com.poly.dindor.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByMatricule(String matricule);
    Optional<Employee> findByCin(String cin);
    boolean existsByMatricule(String matricule);
    boolean existsByCin(String cin);
}
