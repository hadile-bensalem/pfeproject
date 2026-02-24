package com.poly.dindor.repository;

import com.poly.dindor.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long> {

    boolean existsByCodeArticle(String codeArticle);

    boolean existsByDesignationIgnoreCase(String designation);

    boolean existsByDesignationIgnoreCaseAndIdNot(String designation, Long id);

    Optional<Article> findByCodeArticle(String codeArticle);
}
