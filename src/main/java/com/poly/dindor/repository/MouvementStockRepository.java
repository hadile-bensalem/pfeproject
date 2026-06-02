package com.poly.dindor.repository;

import com.poly.dindor.entity.MouvementStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MouvementStockRepository extends JpaRepository<MouvementStock, Long> {

    boolean existsByArticle_Id(Long articleId);

    void deleteByArticle_Id(Long articleId);

    boolean existsByReferenceDocument(String referenceDocument);

    @Query("SELECT m FROM MouvementStock m JOIN FETCH m.article WHERE m.referenceDocument = :ref")
    List<MouvementStock> findByReferenceDocument(@Param("ref") String ref);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM MouvementStock m WHERE m.referenceDocument = :ref")
    void deleteByReferenceDocument(@Param("ref") String ref);

    @Query("SELECT m FROM MouvementStock m JOIN FETCH m.article ORDER BY m.dateOperation DESC")
    List<MouvementStock> findAllOrdered();

    @Query("SELECT m FROM MouvementStock m JOIN FETCH m.article WHERE m.article.id = :articleId ORDER BY m.dateOperation DESC")
    List<MouvementStock> findByArticleId(@Param("articleId") Long articleId);
}
