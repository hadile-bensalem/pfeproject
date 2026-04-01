package com.poly.dindor.service;

import com.poly.dindor.dto.request.RetenueSourceRequest;
import com.poly.dindor.dto.response.RetenueSourceResponse;
import com.poly.dindor.entity.Fournisseur;
import com.poly.dindor.entity.RetenueSource;
import com.poly.dindor.exception.ResourceNotFoundException;
import com.poly.dindor.mapper.RetenueSourceMapper;
import com.poly.dindor.repository.FournisseurRepository;
import com.poly.dindor.repository.RetenueSourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RetenueSourceService {

    private final RetenueSourceRepository retenueRepository;
    private final FournisseurRepository fournisseurRepository;

    // ── Création ──────────────────────────────────────────────────────────

    @Transactional(readOnly = false)
    public RetenueSourceResponse create(RetenueSourceRequest request) {
        Fournisseur fournisseur = fournisseurRepository.findById(request.getFournisseurId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Fournisseur introuvable : " + request.getFournisseurId()));

        RetenueSource entity = RetenueSourceMapper.toEntity(request, fournisseur);

        if (entity.getNumeroDocument() == null || entity.getNumeroDocument().isBlank()) {
            entity.setNumeroDocument(generateNumero());
        }

        RetenueSource saved = retenueRepository.saveAndFlush(entity);
        return RetenueSourceMapper.toResponse(saved);
    }

    // ── Lecture ───────────────────────────────────────────────────────────

    public List<RetenueSourceResponse> getAll() {
        return retenueRepository.findAll().stream()
                .map(RetenueSourceMapper::toResponse)
                .toList();
    }

    public RetenueSourceResponse getById(Long id) {
        return RetenueSourceMapper.toResponse(findByIdWithLignes(id));
    }

    public List<RetenueSourceResponse> getByFournisseur(Long fournisseurId) {
        return retenueRepository
                .findByFournisseurIdOrderByDateRetenueDesc(fournisseurId)
                .stream()
                .map(RetenueSourceMapper::toResponse)
                .toList();
    }

    // ── Suppression ───────────────────────────────────────────────────────

    @Transactional
    public void delete(Long id) {
        if (!retenueRepository.existsById(id)) {
            throw new ResourceNotFoundException("Retenue introuvable : " + id);
        }
        retenueRepository.deleteById(id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /** Charge l'entité avec ses lignes (évite le LazyInitializationException dans le PDF). */
    public RetenueSource findByIdWithLignes(Long id) {
        return retenueRepository.findByIdWithLignes(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certificat introuvable : " + id));
    }

    private String generateNumero() {
        long count = retenueRepository.count() + 1;
        return String.format("RS-%d-%03d", Year.now().getValue(), count);
    }
}
