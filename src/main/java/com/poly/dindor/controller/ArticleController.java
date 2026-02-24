package com.poly.dindor.controller;

import com.poly.dindor.dto.request.ArticleRequest;
import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.ArticleResponse;
import com.poly.dindor.service.ArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/articles")
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService articleService;

    @PostMapping
    public ResponseEntity<ApiResponse<ArticleResponse>> create(@Valid @RequestBody ArticleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Article créé", articleService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ArticleResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(articleService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ArticleResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(articleService.getById(id)));
    }

    @GetMapping("/code/{codeArticle}")
    public ResponseEntity<ApiResponse<ArticleResponse>> getByCode(@PathVariable String codeArticle) {
        return ResponseEntity.ok(ApiResponse.success(articleService.getByCode(codeArticle)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ArticleResponse>> update(
            @PathVariable Long id, @Valid @RequestBody ArticleRequest request) {
        return ResponseEntity.ok(ApiResponse.success(articleService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        articleService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Article supprimé", null));
    }
}
