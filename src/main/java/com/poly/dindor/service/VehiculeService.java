package com.poly.dindor.service;

import com.poly.dindor.dto.request.VehiculeRequest;
import com.poly.dindor.dto.response.VehiculeResponse;
import com.poly.dindor.entity.Vehicule;
import com.poly.dindor.exception.ResourceNotFoundException;
import com.poly.dindor.repository.VehiculeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class VehiculeService {

    private final VehiculeRepository repository;

    public VehiculeService(VehiculeRepository repository) {
        this.repository = repository;
    }

    public List<VehiculeResponse> getAll() {
        return repository.findByActifTrueOrderByImmatriculationAsc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public VehiculeResponse create(VehiculeRequest request) {
        Vehicule v = Vehicule.builder()
                .immatriculation(request.getImmatriculation().trim().toUpperCase())
                .marque(request.getMarque())
                .build();
        return toResponse(repository.save(v));
    }

    @Transactional
    public void delete(Long id) {
        Vehicule v = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule introuvable : " + id));
        v.setActif(false);
        repository.save(v);
    }

    private VehiculeResponse toResponse(Vehicule v) {
        VehiculeResponse r = new VehiculeResponse();
        r.setId(v.getId());
        r.setImmatriculation(v.getImmatriculation());
        r.setMarque(v.getMarque());
        r.setActif(v.isActif());
        return r;
    }
}
