package com.poly.dindor.repository;

import com.poly.dindor.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByCin(String cin);

    List<Employee> findByActifTrue();

    List<Employee> findByActifTrueOrderByNomAsc();

    @Query("SELECT e FROM Employee e ORDER BY e.nom ASC, e.prenom ASC")
    List<Employee> findAllOrdered();

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.actif = true")
    long countActifs();
}
