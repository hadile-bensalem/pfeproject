package com.poly.dindor.repository;

import com.poly.dindor.entity.PaiementClient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaiementClientRepository extends JpaRepository<PaiementClient, Long> {

    List<PaiementClient> findByClient_IdOrderByDatePaiementDescIdDesc(Long clientId);
}
