package com.poly.dindor.controller;

import com.poly.dindor.dto.request.ArticleRequest;
import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.ArticleResponse;
import com.poly.dindor.service.ArticleService;
import com.poly.dindor.service.ImageStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/articles")
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService      articleService;
    private final ImageStorageService imageStorageService;

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

    /** Upload ou remplacement de la photo d'un article. */
    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ArticleResponse>> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(ApiResponse.success("Image enregistrée",
                articleService.uploadImage(id, file)));
    }

    /** Sert le fichier image — accessible sans authentification. */
    @GetMapping("/images/{filename}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) {
        try {
            Path path     = imageStorageService.getPath(filename);
            Resource res  = new UrlResource(path.toUri());
            if (!res.exists()) return ResponseEntity.notFound().build();
            String ct     = Files.probeContentType(path);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(ct != null ? ct : "image/jpeg"))
                    .body(res);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
