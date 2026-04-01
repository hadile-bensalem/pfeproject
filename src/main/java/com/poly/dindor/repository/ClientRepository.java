package com.poly.dindor.repository;

import com.poly.dindor.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    boolean existsByCodeClient(String codeClient);
}
