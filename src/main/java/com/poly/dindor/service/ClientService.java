package com.poly.dindor.service;

import com.poly.dindor.dto.request.ClientRequest;
import com.poly.dindor.dto.response.ClientResponse;
import com.poly.dindor.entity.Client;
import com.poly.dindor.exception.ResourceNotFoundException;
import com.poly.dindor.mapper.ClientMapper;
import com.poly.dindor.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClientService {

    private final ClientRepository clientRepository;

    public String getNextCodeClient() {
        int yearShort = Year.now().getValue() % 100;
        String prefix = "C" + yearShort + "/%";
        long seq = clientRepository.findMaxSeqForPrefix(prefix);
        return String.format("C%d/%04d", yearShort, seq + 1);
    }

    public List<ClientResponse> getAll() {
        return clientRepository.findAllByOrderByNomAsc()
                .stream().map(ClientMapper::toResponse).collect(Collectors.toList());
    }

    public List<ClientResponse> getActifs() {
        return clientRepository.findByActifTrueOrderByNomAsc()
                .stream().map(ClientMapper::toResponse).collect(Collectors.toList());
    }

    public List<ClientResponse> search(String q) {
        return clientRepository.search(q == null ? "" : q)
                .stream().map(ClientMapper::toResponse).collect(Collectors.toList());
    }

    public ClientResponse getById(Long id) {
        return ClientMapper.toResponse(findOrThrow(id));
    }

    @Transactional
    public ClientResponse create(ClientRequest request) {
        String code = getNextCodeClient();
        Client client = ClientMapper.toEntity(request, code);
        client.setDateInscription(LocalDate.now());
        return ClientMapper.toResponse(clientRepository.save(client));
    }

    @Transactional
    public ClientResponse update(Long id, ClientRequest request) {
        Client client = findOrThrow(id);
        ClientMapper.updateEntity(client, request);
        return ClientMapper.toResponse(clientRepository.save(client));
    }

    @Transactional
    public void delete(Long id) {
        Client client = findOrThrow(id);
        if (client.getSoldeTotalDu() != null
                && client.getSoldeTotalDu().compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalStateException(
                "Impossible de supprimer le client « " + client.getNom()
                + " » : solde impayé de " + client.getSoldeTotalDu() + " DT.");
        }
        clientRepository.delete(client);
    }

    Client findOrThrow(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable : " + id));
    }
}
