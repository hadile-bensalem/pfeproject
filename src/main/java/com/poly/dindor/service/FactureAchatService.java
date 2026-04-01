package com.poly.dindor.service;

import com.poly.dindor.dto.request.FactureAchatRequest;
import com.poly.dindor.dto.response.FactureAchatResponse;
import com.poly.dindor.entity.FactureAchat;
import com.poly.dindor.entity.Fournisseur;
import com.poly.dindor.exception.ResourceNotFoundException;
import com.poly.dindor.mapper.FactureAchatMapper;
import com.poly.dindor.repository.FactureAchatRepository;
import com.poly.dindor.repository.FournisseurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FactureAchatService {

    private final FactureAchatRepository factureRepository;
    private final FournisseurRepository  fournisseurRepository;

    // ── Numérotation ──────────────────────────────────────────────────────

    public String getNextNumero() {
        int year = Year.now().getValue();
        long maxSeq = factureRepository.findMaxSeqForYearPrefix(year + "%");
        return String.format("%d%06d", year, maxSeq + 1);
    }

    // ── Création ──────────────────────────────────────────────────────────

    @Transactional
    public FactureAchatResponse create(FactureAchatRequest request) {
        Fournisseur fournisseur = fournisseurRepository.findById(request.getFournisseurId())
            .orElseThrow(() -> new ResourceNotFoundException(
                "Fournisseur introuvable : " + request.getFournisseurId()));

        if (request.getNumeroFacture() == null || request.getNumeroFacture().isBlank()
                || factureRepository.existsByNumeroFacture(request.getNumeroFacture())) {
            request.setNumeroFacture(getNextNumero());
        }

        FactureAchat facture = FactureAchatMapper.toEntity(request, fournisseur);
        return FactureAchatMapper.toResponse(factureRepository.save(facture));
    }

    // ── Lecture ───────────────────────────────────────────────────────────

    public FactureAchatResponse getById(Long id) {
        return FactureAchatMapper.toResponse(
            factureRepository.findByIdWithLignes(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable : " + id)));
    }

    public List<FactureAchatResponse> getAll() {
        return factureRepository.findAllOrdered().stream()
            .map(FactureAchatMapper::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public void delete(Long id) {
        if (!factureRepository.existsById(id))
            throw new ResourceNotFoundException("Facture introuvable : " + id);
        factureRepository.deleteById(id);
    }

    /** Retourne l'entité complète (pour génération PDF). */
    public FactureAchat findEntityById(Long id) {
        return factureRepository.findByIdWithLignes(id)
            .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable : " + id));
    }
}
