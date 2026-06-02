package com.poly.dindor.service;

import com.poly.dindor.dto.request.DecoupePouletLigneRequest;
import com.poly.dindor.dto.request.DecoupePouletRequest;
import com.poly.dindor.dto.response.DecoupePouletLigneResponse;
import com.poly.dindor.dto.response.DecoupePouletResponse;
import com.poly.dindor.entity.DecoupePoulet;
import com.poly.dindor.entity.DecoupePouletLigne;
import com.poly.dindor.exception.ResourceNotFoundException;
import com.poly.dindor.repository.DecoupePouletRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DecoupePouletService {

    private final DecoupePouletRepository repository;

    public DecoupePouletService(DecoupePouletRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public DecoupePouletResponse create(DecoupePouletRequest request) {
        BigDecimal totalAchat = request.getQteAchetee()
                .multiply(request.getPrixUnitaireAchat())
                .setScale(3, RoundingMode.HALF_UP);

        DecoupePoulet decoupe = new DecoupePoulet();
        decoupe.setDateDecoupe(LocalDate.parse(request.getDateDecoupe()));
        decoupe.setNumeroLot(request.getNumeroLot() != null ? request.getNumeroLot() : "");
        decoupe.setQteAchetee(request.getQteAchetee());
        decoupe.setPrixUnitaireAchat(request.getPrixUnitaireAchat());
        decoupe.setTotalAchat(totalAchat);
        decoupe.setProduitCalcule(request.getProduitCalcule());

        for (DecoupePouletLigneRequest lr : request.getLignes()) {
            DecoupePouletLigne ligne = new DecoupePouletLigne();
            ligne.setDecoupe(decoupe);
            ligne.setProduit(lr.getProduit());
            ligne.setUnite(lr.getUnite());
            ligne.setQuantite(lr.getQuantite().setScale(3, RoundingMode.HALF_UP));
            ligne.setPrixUnitaire(lr.getPrixUnitaire().setScale(3, RoundingMode.HALF_UP));
            ligne.setTotalValeur(lr.getTotalValeur().setScale(3, RoundingMode.HALF_UP));
            ligne.setCalcule(lr.isCalcule());
            decoupe.getLignes().add(ligne);
        }

        return toResponse(repository.save(decoupe));
    }

    public List<DecoupePouletResponse> getFiltered(String dateDebutStr, String dateFinStr) {
        LocalDate dateDebut = (dateDebutStr != null && !dateDebutStr.isBlank())
                ? LocalDate.parse(dateDebutStr) : LocalDate.of(1900, 1, 1);
        LocalDate dateFin = (dateFinStr != null && !dateFinStr.isBlank())
                ? LocalDate.parse(dateFinStr) : LocalDate.of(2100, 12, 31);

        return repository.findByPeriodWithLignes(dateDebut, dateFin)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public DecoupePouletResponse getById(Long id) {
        return toResponse(repository.findByIdWithLignes(id)
                .orElseThrow(() -> new ResourceNotFoundException("Découpe introuvable : " + id)));
    }

    @Transactional
    public DecoupePouletResponse update(Long id, DecoupePouletRequest request) {
        DecoupePoulet decoupe = repository.findByIdWithLignes(id)
                .orElseThrow(() -> new ResourceNotFoundException("Découpe introuvable : " + id));

        BigDecimal totalAchat = request.getQteAchetee()
                .multiply(request.getPrixUnitaireAchat())
                .setScale(3, RoundingMode.HALF_UP);

        decoupe.setDateDecoupe(LocalDate.parse(request.getDateDecoupe()));
        decoupe.setNumeroLot(request.getNumeroLot() != null ? request.getNumeroLot() : "");
        decoupe.setQteAchetee(request.getQteAchetee());
        decoupe.setPrixUnitaireAchat(request.getPrixUnitaireAchat());
        decoupe.setTotalAchat(totalAchat);
        decoupe.setProduitCalcule(request.getProduitCalcule());

        decoupe.getLignes().clear();
        for (DecoupePouletLigneRequest lr : request.getLignes()) {
            DecoupePouletLigne ligne = new DecoupePouletLigne();
            ligne.setDecoupe(decoupe);
            ligne.setProduit(lr.getProduit());
            ligne.setUnite(lr.getUnite());
            ligne.setQuantite(lr.getQuantite().setScale(3, RoundingMode.HALF_UP));
            ligne.setPrixUnitaire(lr.getPrixUnitaire().setScale(3, RoundingMode.HALF_UP));
            ligne.setTotalValeur(lr.getTotalValeur().setScale(3, RoundingMode.HALF_UP));
            ligne.setCalcule(lr.isCalcule());
            decoupe.getLignes().add(ligne);
        }

        return toResponse(repository.save(decoupe));
    }

    @Transactional
    public void delete(Long id) {
        DecoupePoulet d = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Découpe introuvable : " + id));
        repository.delete(d);
    }

    // ── Mapping ───────────────────────────────────────────────────────────

    private DecoupePouletResponse toResponse(DecoupePoulet d) {
        DecoupePouletResponse r = new DecoupePouletResponse();
        r.setId(d.getId());
        r.setDateDecoupe(d.getDateDecoupe().toString());
        r.setNumeroLot(d.getNumeroLot());
        r.setQteAchetee(d.getQteAchetee());
        r.setPrixUnitaireAchat(d.getPrixUnitaireAchat());
        r.setTotalAchat(d.getTotalAchat());
        r.setProduitCalcule(d.getProduitCalcule());
        if (d.getDateCreation() != null) r.setDateCreation(d.getDateCreation().toString());
        if (d.getLignes() != null) {
            r.setLignes(d.getLignes().stream().map(l -> {
                DecoupePouletLigneResponse lr = new DecoupePouletLigneResponse();
                lr.setId(l.getId());
                lr.setProduit(l.getProduit());
                lr.setUnite(l.getUnite());
                lr.setQuantite(l.getQuantite());
                lr.setPrixUnitaire(l.getPrixUnitaire());
                lr.setTotalValeur(l.getTotalValeur());
                lr.setCalcule(l.isCalcule());
                return lr;
            }).collect(Collectors.toList()));
        }
        return r;
    }
}
