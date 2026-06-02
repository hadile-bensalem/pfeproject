package com.poly.dindor.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Stockage des images d'articles sur le système de fichiers local.
 * Répertoire configurable via app.uploads.dir (défaut : uploads/).
 */
@Service
@Slf4j
public class ImageStorageService {

    @Value("${app.uploads.dir:uploads}")
    private String uploadsDir;

    /**
     * Enregistre le fichier et retourne le nom généré (UUID + extension).
     */
    public String store(MultipartFile file) throws IOException {
        String original  = file.getOriginalFilename();
        String extension = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf('.'))
                : ".jpg";
        String filename  = UUID.randomUUID() + extension;

        Path uploadPath = Paths.get(uploadsDir, "articles");
        Files.createDirectories(uploadPath);
        Files.copy(file.getInputStream(), uploadPath.resolve(filename));

        log.info("Image stockée : {}", filename);
        return filename;
    }

    /** Supprime l'ancienne image si elle existe. */
    public void delete(String filename) {
        if (filename == null || filename.isBlank()) return;
        try {
            Files.deleteIfExists(Paths.get(uploadsDir, "articles", filename));
        } catch (IOException e) {
            log.warn("Impossible de supprimer l'image {}: {}", filename, e.getMessage());
        }
    }

    /** Retourne le chemin absolu d'une image. */
    public Path getPath(String filename) {
        return Paths.get(uploadsDir, "articles", filename).toAbsolutePath();
    }
}
