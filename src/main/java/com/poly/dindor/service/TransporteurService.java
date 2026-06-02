package com.poly.dindor.service;

import com.poly.dindor.dto.request.TransporteurRequest;
import com.poly.dindor.dto.response.TransporteurResponse;
import com.poly.dindor.entity.Transporteur;
import com.poly.dindor.exception.ResourceNotFoundException;
import com.poly.dindor.repository.TransporteurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class TransporteurService {

    private final TransporteurRepository repository;

    public TransporteurService(TransporteurRepository repository) {
        this.repository = repository;
    }

    public List<TransporteurResponse> getAll() {
        return repository.findByActifTrueOrderByNomAsc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public TransporteurResponse create(TransporteurRequest request) {
        Transporteur t = Transporteur.builder()
                .nom(request.getNom().trim())
                .telephone(request.getTelephone())
                .cin(request.getCin())
                .build();
        return toResponse(repository.save(t));
    }

    @Transactional
    public void delete(Long id) {
        Transporteur t = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transporteur introuvable : " + id));
        t.setActif(false);
        repository.save(t);
    }

    private TransporteurResponse toResponse(Transporteur t) {
        TransporteurResponse r = new TransporteurResponse();
        r.setId(t.getId());
        r.setNom(t.getNom());
        r.setTelephone(t.getTelephone());
        r.setCin(t.getCin());
        r.setActif(t.isActif());
        return r;
    }
}
