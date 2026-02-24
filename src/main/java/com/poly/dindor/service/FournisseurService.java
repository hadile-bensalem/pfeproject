package com.poly.dindor.service;

import com.poly.dindor.dto.request.FournisseurRequest;
import com.poly.dindor.dto.response.FournisseurResponse;
import com.poly.dindor.entity.Fournisseur;
import com.poly.dindor.mapper.FournisseurMapper;
import com.poly.dindor.repository.FournisseurRepository;
import com.poly.dindor.util.ServiceUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FournisseurService {

    private final FournisseurRepository fournisseurRepository;

    @Transactional
    public FournisseurResponse create(FournisseurRequest request) {
        if (fournisseurRepository.existsByMatricule(request.getMatricule())) {
            throw new IllegalArgumentException("Un fournisseur avec ce matricule existe déjà");
        }
        Fournisseur entity = FournisseurMapper.toEntity(request);
        return FournisseurMapper.toResponse(fournisseurRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<FournisseurResponse> getAll() {
        return fournisseurRepository.findAll().stream()
                .map(FournisseurMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FournisseurResponse getById(Long id) {
        return FournisseurMapper.toResponse(ServiceUtils.findByIdOrThrow(fournisseurRepository, id, "Fournisseur"));
    }

    @Transactional
    public FournisseurResponse update(Long id, FournisseurRequest request) {
        Fournisseur entity = ServiceUtils.findByIdOrThrow(fournisseurRepository, id, "Fournisseur");
        if (!entity.getMatricule().equals(request.getMatricule())
                && fournisseurRepository.existsByMatricule(request.getMatricule())) {
            throw new IllegalArgumentException("Un fournisseur avec ce matricule existe déjà");
        }
        FournisseurMapper.updateEntity(entity, request);
        return FournisseurMapper.toResponse(fournisseurRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        ServiceUtils.deleteByIdOrThrow(fournisseurRepository, id, "Fournisseur");
    }
}
