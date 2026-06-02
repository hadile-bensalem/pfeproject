package com.poly.dindor.service;

import com.poly.dindor.dto.request.PaiementClientRequest;
import com.poly.dindor.dto.response.BonLivraisonResponse;
import com.poly.dindor.dto.response.ClientResponse;
import com.poly.dindor.dto.response.PaiementClientResponse;
import com.poly.dindor.entity.Client;
import com.poly.dindor.entity.PaiementClient;
import com.poly.dindor.exception.ResourceNotFoundException;
import com.poly.dindor.mapper.BonLivraisonMapper;
import com.poly.dindor.mapper.ClientMapper;
import com.poly.dindor.repository.BonLivraisonRepository;
import com.poly.dindor.repository.ClientRepository;
import com.poly.dindor.repository.PaiementClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClientCreditService {

    private final ClientRepository       clientRepository;
    private final PaiementClientRepository paiementRepository;
    private final BonLivraisonRepository blRepository;

    public List<ClientResponse> getCrediteurs() {
        return clientRepository.findAllByOrderByNomAsc()
                .stream()
                .filter(c -> c.getSoldeTotalDu().compareTo(BigDecimal.ZERO) > 0 || !c.getSoldeTotalDu().equals(BigDecimal.ZERO))
                .map(ClientMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<ClientResponse> getAllWithSolde() {
        return clientRepository.findAllByOrderByNomAsc()
                .stream().map(ClientMapper::toResponse).collect(Collectors.toList());
    }

    public List<BonLivraisonResponse> getBonsByClient(Long clientId) {
        return blRepository.findByClientId(clientId)
                .stream().map(BonLivraisonMapper::toResponse).collect(Collectors.toList());
    }

    public List<PaiementClientResponse> getPaiementsByClient(Long clientId) {
        return paiementRepository.findByClient_IdOrderByDatePaiementDescIdDesc(clientId)
                .stream().map(this::toPaiementResponse).collect(Collectors.toList());
    }

    @Transactional
    public PaiementClientResponse addPaiement(Long clientId, PaiementClientRequest req) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable : " + clientId));

        LocalDate date = req.getDatePaiement() != null && !req.getDatePaiement().isBlank()
                ? LocalDate.parse(req.getDatePaiement()) : LocalDate.now();

        PaiementClient.ModePaiement mode = PaiementClient.ModePaiement.ESPECE;
        if (req.getModePaiement() != null) {
            try { mode = PaiementClient.ModePaiement.valueOf(req.getModePaiement()); }
            catch (IllegalArgumentException ignored) {}
        }

        LocalDate echeance = null;
        if (req.getEcheance() != null && !req.getEcheance().isBlank()) {
            try { echeance = LocalDate.parse(req.getEcheance()); }
            catch (Exception ignored) {}
        }

        PaiementClient paiement = PaiementClient.builder()
                .client(client)
                .montant(req.getMontant())
                .datePaiement(date)
                .notes(req.getNotes())
                .blNumeros(req.getBlNumeros())
                .modePaiement(mode)
                .numeroPaiement(req.getNumeroPaiement())
                .echeance(echeance)
                .banque(req.getBanque())
                .build();

        paiementRepository.save(paiement);

        BigDecimal nouveau = client.getSoldeTotalDu().subtract(req.getMontant());
        client.setSoldeTotalDu(nouveau);
        clientRepository.save(client);

        return toPaiementResponse(paiement);
    }

    @Transactional
    public void deletePaiement(Long clientId, Long paiementId) {
        PaiementClient paiement = paiementRepository.findById(paiementId)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement introuvable : " + paiementId));
        Client client = paiement.getClient();

        client.setSoldeTotalDu(client.getSoldeTotalDu().add(paiement.getMontant()));
        clientRepository.save(client);
        paiementRepository.delete(paiement);
    }

    private PaiementClientResponse toPaiementResponse(PaiementClient p) {
        PaiementClientResponse r = new PaiementClientResponse();
        r.setId(p.getId());
        r.setClientId(p.getClient().getId());
        r.setClientNom(p.getClient().getNom());
        r.setMontant(p.getMontant());
        r.setDatePaiement(p.getDatePaiement().toString());
        r.setNotes(p.getNotes());
        r.setBlNumeros(p.getBlNumeros());
        r.setModePaiement(p.getModePaiement() != null ? p.getModePaiement().name() : "ESPECE");
        r.setNumeroPaiement(p.getNumeroPaiement());
        r.setEcheance(p.getEcheance() != null ? p.getEcheance().toString() : null);
        r.setBanque(p.getBanque());
        r.setDateCreation(p.getDateCreation() != null ? p.getDateCreation().toString() : null);
        return r;
    }
}
