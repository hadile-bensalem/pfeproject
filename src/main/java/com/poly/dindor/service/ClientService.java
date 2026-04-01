package com.poly.dindor.service;

import com.poly.dindor.dto.request.ClientRequest;
import com.poly.dindor.dto.response.ClientResponse;
import com.poly.dindor.entity.Client;
import com.poly.dindor.exception.ResourceNotFoundException;
import com.poly.dindor.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClientService {

    private final ClientRepository clientRepository;

    public List<ClientResponse> getAll() {
        return clientRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ClientResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional(readOnly = false)
    public ClientResponse create(ClientRequest request) {
        Client client = Client.builder()
                .codeClient(request.getCodeClient())
                .nom(request.getNom())
                .adresse(request.getAdresse())
                .telephone(request.getTelephone())
                .email(request.getEmail())
                .observations(request.getObservations())
                .build();
        return toResponse(clientRepository.saveAndFlush(client));
    }

    @Transactional(readOnly = false)
    public ClientResponse update(Long id, ClientRequest request) {
        Client client = findOrThrow(id);
        client.setCodeClient(request.getCodeClient());
        client.setNom(request.getNom());
        client.setAdresse(request.getAdresse());
        client.setTelephone(request.getTelephone());
        client.setEmail(request.getEmail());
        client.setObservations(request.getObservations());
        return toResponse(clientRepository.saveAndFlush(client));
    }

    @Transactional(readOnly = false)
    public void delete(Long id) {
        clientRepository.delete(findOrThrow(id));
    }

    private Client findOrThrow(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable : " + id));
    }

    private ClientResponse toResponse(Client c) {
        return ClientResponse.builder()
                .id(c.getId())
                .codeClient(c.getCodeClient())
                .nom(c.getNom())
                .adresse(c.getAdresse())
                .telephone(c.getTelephone())
                .email(c.getEmail())
                .observations(c.getObservations())
                .dateCreation(c.getDateCreation())
                .dateModification(c.getDateModification())
                .build();
    }
}
