package com.poly.dindor.service;

import com.poly.dindor.dto.request.ArticleRequest;
import com.poly.dindor.dto.response.ArticleResponse;
import com.poly.dindor.entity.Article;
import com.poly.dindor.exception.ResourceNotFoundException;
import com.poly.dindor.mapper.ArticleMapper;
import com.poly.dindor.repository.ArticleRepository;
import com.poly.dindor.repository.LotStockRepository;
import com.poly.dindor.repository.MouvementStockRepository;

import com.poly.dindor.util.ServiceUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleRepository             articleRepository;
    private final ImageStorageService           imageStorageService;
    private final LotStockRepository            lotStockRepository;
    private final MouvementStockRepository      mouvementStockRepository;

    private static String trimOrEmpty(String s) {
        return s != null ? s.trim() : "";
    }

    @Transactional
    public ArticleResponse create(ArticleRequest request) {
        if (articleRepository.existsByCodeArticle(request.getCodeArticle())) {
            throw new IllegalArgumentException("Un article avec ce code existe déjà");
        }
        String des = trimOrEmpty(request.getDesignation());
        if (!des.isEmpty() && articleRepository.existsByDesignationIgnoreCase(des)) {
            throw new IllegalArgumentException("Un article avec cette désignation existe déjà");
        }
        return ArticleMapper.toResponse(articleRepository.save(ArticleMapper.toEntity(request)));
    }

    @Transactional(readOnly = true)
    public List<ArticleResponse> getAll() {
        return articleRepository.findAll().stream().map(ArticleMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ArticleResponse getById(Long id) {
        return ArticleMapper.toResponse(ServiceUtils.findByIdOrThrow(articleRepository, id, "Article"));
    }

    @Transactional(readOnly = true)
    public ArticleResponse getByCode(String codeArticle) {
        Article entity = articleRepository.findByCodeArticle(codeArticle)
                .orElseThrow(() -> new ResourceNotFoundException("Article introuvable"));
        return ArticleMapper.toResponse(entity);
    }

    @Transactional
    public ArticleResponse update(Long id, ArticleRequest request) {
        Article e = ServiceUtils.findByIdOrThrow(articleRepository, id, "Article");
        if (!e.getCodeArticle().equals(request.getCodeArticle())
                && articleRepository.existsByCodeArticle(request.getCodeArticle())) {
            throw new IllegalArgumentException("Un article avec ce code existe déjà");
        }
        String des = trimOrEmpty(request.getDesignation());
        if (!des.isEmpty() && !trimOrEmpty(e.getDesignation()).equalsIgnoreCase(des)
                && articleRepository.existsByDesignationIgnoreCaseAndIdNot(des, id)) {
            throw new IllegalArgumentException("Un article avec cette désignation existe déjà");
        }
        ArticleMapper.updateEntity(e, request);
        return ArticleMapper.toResponse(articleRepository.save(e));
    }

    @Transactional
    public void delete(Long id) {
        deleteRecursive(id, 0);
    }

    private void deleteRecursive(Long id, int depth) {
        if (depth > 10) {
            throw new IllegalStateException("Chaîne d'articles trop profonde — possible cycle détecté.");
        }
        Article article = ServiceUtils.findByIdOrThrow(articleRepository, id, "Article");
        for (Article enfant : articleRepository.findByCodeArticleSource(article.getCodeArticle())) {
            deleteRecursive(enfant.getId(), depth + 1);
        }
        lotStockRepository.clearArticleDeriveByArticleId(article.getId());
        mouvementStockRepository.deleteByArticle_Id(article.getId());
        lotStockRepository.deleteByArticleOrigine_Id(article.getId());
        imageStorageService.delete(article.getImageUrl());
        articleRepository.delete(article);
    }

    @Transactional
    public ArticleResponse uploadImage(Long id, MultipartFile file) throws IOException {
        Article article = ServiceUtils.findByIdOrThrow(articleRepository, id, "Article");
        imageStorageService.delete(article.getImageUrl());
        article.setImageUrl(imageStorageService.store(file));
        return ArticleMapper.toResponse(articleRepository.save(article));
    }
}
