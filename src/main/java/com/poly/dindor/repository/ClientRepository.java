package com.poly.dindor.repository;

import com.poly.dindor.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long> {

    boolean existsByCodeClient(String codeClient);

    Optional<Client> findByCodeClient(String codeClient);

    List<Client> findAllByOrderByNomAsc();

    List<Client> findByActifTrueOrderByNomAsc();

    @Query(value = "SELECT COALESCE(MAX(CAST(SPLIT_PART(code_client, '/', 2) AS INTEGER)), 0) " +
                   "FROM clients WHERE code_client LIKE :prefix", nativeQuery = true)
    long findMaxSeqForPrefix(@Param("prefix") String prefix);

    @Query("SELECT c FROM Client c WHERE c.soldeTotalDu > 0 ORDER BY c.soldeTotalDu DESC")
    List<Client> findCrediteurs();

    @Query("SELECT c FROM Client c WHERE LOWER(c.nom) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(c.codeClient) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY c.nom ASC")
    List<Client> search(@Param("q") String q);
}
