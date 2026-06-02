package com.poly.dindor.service;

import com.poly.dindor.dto.response.TraiteAlertDTO;
import com.poly.dindor.repository.PaiementAchatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TraiteNotificationService {

    private static final int HORIZON_JOURS = 7;

    private final PaiementAchatRepository paiementAchatRepository;

    @Transactional(readOnly = true)
    public List<TraiteAlertDTO> getTraitesEcheantProchainement() {
        LocalDate today = LocalDate.now();
        LocalDate limite = today.plusDays(HORIZON_JOURS);

        return paiementAchatRepository
                .findTraitesEcheantDans(today, limite)
                .stream()
                .map(p -> TraiteAlertDTO.builder()
                        .factureId(p.getFactureAchat().getId())
                        .numeroFacture(p.getFactureAchat().getNumeroFacture())
                        .numeroTraite(p.getNumeroTraite())
                        .fournisseur(p.getFactureAchat().getFournisseur().getRaisonSociale())
                        .montant(p.getMontantReste())
                        .dateEcheance(p.getDateEcheance().toString())
                        .joursRestants((int) ChronoUnit.DAYS.between(today, p.getDateEcheance()))
                        .build())
                .toList();
    }
}
