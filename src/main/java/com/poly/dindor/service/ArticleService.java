package com.poly.dindor.service;

import com.poly.dindor.dto.request.ArticleRequest;
import com.poly.dindor.dto.response.ArticleResponse;
import com.poly.dindor.entity.Article;
import com.poly.dindor.exception.ResourceNotFoundException;
import com.poly.dindor.mapper.ArticleMapper;
import com.poly.dindor.repository.ArticleRepository;
import com.poly.dindor.util.ServiceUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleRepository articleRepository;

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
        ServiceUtils.deleteByIdOrThrow(articleRepository, id, "Article");
    }
}
