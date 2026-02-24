package com.poly.dindor.util;

import com.poly.dindor.exception.ResourceNotFoundException;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Utilitaires pour éviter la duplication dans les services CRUD
 * (findById + orElseThrow, delete avec vérification 404).
 */
public final class ServiceUtils {

    private ServiceUtils() {
    }

    public static <T> T findByIdOrThrow(JpaRepository<T, Long> repo, Long id, String resourceName) {
        return repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(resourceName + " introuvable"));
    }

    public static void deleteByIdOrThrow(JpaRepository<?, Long> repo, Long id, String resourceName) {
        if (!repo.existsById(id)) {
            throw new ResourceNotFoundException(resourceName + " introuvable");
        }
        repo.deleteById(id);
    }
}
