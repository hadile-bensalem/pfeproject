package com.poly.dindor.service;

import com.poly.dindor.dto.request.FactureAchatRequest;
import com.poly.dindor.dto.response.FactureAchatResponse;
import com.poly.dindor.entity.FactureAchat;
import com.poly.dindor.entity.FactureAchatLigne;
import com.poly.dindor.entity.Fournisseur;
import com.poly.dindor.exception.ResourceNotFoundException;
import com.poly.dindor.mapper.FactureAchatMapper;
import com.poly.dindor.repository.FactureAchatRepository;
import com.poly.dindor.repository.FournisseurRepository;
import com.poly.dindor.repository.MouvementStockRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@Slf4j
public class FactureAchatService {

    private final FactureAchatRepository    factureRepository;
    private final FournisseurRepository     fournisseurRepository;
    private final StockService              stockService;
    private final MouvementStockRepository  mouvementRepository;

    public FactureAchatService(FactureAchatRepository factureRepository,
                               FournisseurRepository fournisseurRepository,
                               MouvementStockRepository mouvementRepository,
                               @Lazy StockService stockService) {
        this.factureRepository     = factureRepository;
        this.fournisseurRepository  = fournisseurRepository;
        this.mouvementRepository   = mouvementRepository;
        this.stockService           = stockService;
    }

    // ── Numérotation ──────────────────────────────────────────────────────

    public String getNextNumero() {
        int year = Year.now().getValue();
        long maxSeq = factureRepository.findMaxSeqForYearPrefix(year + "%");
        return String.format("%d%06d", year, maxSeq + 1);
    }

    // ── Sauvegarder en brouillon ──────────────────────────────────────────

    @Transactional
    public FactureAchatResponse sauvegarderBrouillon(FactureAchatRequest request) {
        Fournisseur fournisseur = fournisseurRepository.findById(request.getFournisseurId())
            .orElseThrow(() -> new ResourceNotFoundException(
                "Fournisseur introuvable : " + request.getFournisseurId()));

        if (request.getNumeroFacture() == null || request.getNumeroFacture().isBlank()
                || factureRepository.existsByNumeroFacture(request.getNumeroFacture())) {
            request.setNumeroFacture(getNextNumero());
        }

        FactureAchat facture = FactureAchatMapper.toEntity(request, fournisseur);
        facture.setStatut(FactureAchat.StatutFacture.BROUILLON);
        FactureAchat saved = factureRepository.save(facture);

        // Incrémenter stock_en_attente pour chaque ligne
        for (FactureAchatLigne ligne : saved.getLignes()) {
            stockService.entreeStockBrouillon(ligne);
        }

        log.info("Facture achat BROUILLON créée : {}", saved.getNumeroFacture());
        return FactureAchatMapper.toResponse(saved);
    }

    // ── Valider définitivement ─────────────────────────────────────────────

    @Transactional
    public FactureAchatResponse validerFactureAchat(Long id) {
        FactureAchat facture = factureRepository.findByIdWithLignes(id)
            .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable : " + id));

        if (facture.getStatut() == FactureAchat.StatutFacture.VALIDEE
                || facture.getStatut() == FactureAchat.StatutFacture.PAYEE) {
            throw new IllegalStateException("Cette facture est déjà validée.");
        }

        facture.setStatut(FactureAchat.StatutFacture.VALIDEE);
        factureRepository.save(facture);

        // Vérifier si les mouvements ont déjà été appliqués (factures créées avant le fix)
        boolean dejaApplique = mouvementRepository.existsByReferenceDocument(facture.getNumeroFacture());
        if (!dejaApplique) {
            for (FactureAchatLigne ligne : facture.getLignes()) {
                stockService.entreeStockValide(ligne, facture);
            }
        } else {
            log.info("Facture {} : mouvements de stock déjà présents, statut mis à VALIDÉE sans re-traitement.", facture.getNumeroFacture());
        }

        log.info("Facture achat VALIDÉE : {}", facture.getNumeroFacture());
        return FactureAchatMapper.toResponse(facture);
    }

    // ── Modifier un brouillon ─────────────────────────────────────────────

    @Transactional
    public FactureAchatResponse updateBrouillon(Long id, FactureAchatRequest request) {
        FactureAchat existing = factureRepository.findByIdWithLignes(id)
            .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable : " + id));

        if (existing.getStatut() != FactureAchat.StatutFacture.BROUILLON) {
            throw new IllegalStateException("Seules les factures BROUILLON peuvent être modifiées.");
        }

        Fournisseur fournisseur = fournisseurRepository.findById(request.getFournisseurId())
            .orElseThrow(() -> new ResourceNotFoundException("Fournisseur introuvable : " + request.getFournisseurId()));

        // Annuler le stock_en_attente des anciennes lignes
        for (FactureAchatLigne old : existing.getLignes()) {
            stockService.annulerStockBrouillon(old);
        }

        // Remplacement : reconstruire via mapper sur un objet temporaire
        FactureAchat temp = FactureAchatMapper.toEntity(request, fournisseur);
        existing.setDateFacture(temp.getDateFacture());
        existing.setFournisseur(fournisseur);
        existing.getLignes().clear();
        temp.getLignes().forEach(l -> { l.setFactureAchat(existing); existing.getLignes().add(l); });
        existing.recalculerTotaux();

        FactureAchat saved = factureRepository.save(existing);

        // Réappliquer stock_en_attente avec les nouvelles lignes
        for (FactureAchatLigne ligne : saved.getLignes()) {
            stockService.entreeStockBrouillon(ligne);
        }

        log.info("Facture brouillon {} mise à jour.", saved.getNumeroFacture());
        return FactureAchatMapper.toResponse(saved);
    }

    // ── Création directe (déjà validée) ───────────────────────────────────

    @Transactional
    public FactureAchatResponse create(FactureAchatRequest request) {
        return create(request, true);
    }

    @Transactional
    public FactureAchatResponse create(FactureAchatRequest request, boolean applyStockMouvements) {
        Fournisseur fournisseur = fournisseurRepository.findById(request.getFournisseurId())
            .orElseThrow(() -> new ResourceNotFoundException(
                "Fournisseur introuvable : " + request.getFournisseurId()));

        if (request.getNumeroFacture() == null || request.getNumeroFacture().isBlank()
                || factureRepository.existsByNumeroFacture(request.getNumeroFacture())) {
            request.setNumeroFacture(getNextNumero());
        }

        FactureAchat facture = FactureAchatMapper.toEntity(request, fournisseur);
        if (applyStockMouvements) {
            facture.setStatut(FactureAchat.StatutFacture.VALIDEE);
        }
        FactureAchat saved = factureRepository.save(facture);

        if (applyStockMouvements) {
            stockService.creerEntreeAchat(saved);
        }

        return FactureAchatMapper.toResponse(saved);
    }

    @Transactional
    public FactureAchatResponse createImportFacture(FactureAchatRequest request, boolean applyStockMouvements) {
        Fournisseur fournisseur = fournisseurRepository.findById(request.getFournisseurId())
            .orElseThrow(() -> new ResourceNotFoundException(
                "Fournisseur introuvable : " + request.getFournisseurId()));

        if (request.getNumeroFacture() == null || request.getNumeroFacture().isBlank()) {
            request.setNumeroFacture(getNextNumero());
        } else if (factureRepository.existsByNumeroFacture(request.getNumeroFacture().trim())) {
            throw new IllegalStateException("Numéro de facture déjà présent : " + request.getNumeroFacture().trim());
        } else {
            request.setNumeroFacture(request.getNumeroFacture().trim());
        }

        FactureAchat facture = FactureAchatMapper.toEntity(request, fournisseur);
        facture.setStatut(FactureAchat.StatutFacture.VALIDEE);
        FactureAchat saved = factureRepository.save(facture);

        if (applyStockMouvements) {
            stockService.creerEntreeAchat(saved);
        }

        return FactureAchatMapper.toResponse(saved);
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
        FactureAchat facture = factureRepository.findByIdWithLignes(id)
            .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable : " + id));

        if (facture.getStatut() == FactureAchat.StatutFacture.BROUILLON) {
            for (FactureAchatLigne ligne : facture.getLignes()) {
                stockService.annulerStockBrouillon(ligne);
            }
        } else {
            stockService.annulerEntreeValidee(facture);
        }

        factureRepository.deleteById(id);
        log.info("Facture achat {} supprimée.", facture.getNumeroFacture());
    }

    public FactureAchat findEntityById(Long id) {
        return factureRepository.findByIdWithLignes(id)
            .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable : " + id));
    }
}
