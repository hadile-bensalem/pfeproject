package com.poly.dindor.repository;

import com.poly.dindor.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long> {

    boolean existsByCodeArticle(String codeArticle);

    boolean existsByDesignationIgnoreCase(String designation);

    boolean existsByDesignationIgnoreCaseAndIdNot(String designation, Long id);

    Optional<Article> findByCodeArticle(String codeArticle);

    List<Article> findByCodeArticleSource(String codeArticleSource);

    /** Stock actuel + stock minimum pour un article recherché par désignation partielle. */
    @Query("SELECT a FROM Article a WHERE LOWER(a.designation) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Article> findByDesignationContainingIgnoreCase(@Param("keyword") String keyword);
}
