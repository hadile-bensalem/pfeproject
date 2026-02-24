package com.poly.dindor.service;

import com.poly.dindor.dto.request.TravailleurRequest;
import com.poly.dindor.dto.response.TravailleurResponse;
import com.poly.dindor.entity.Travailleur;
import com.poly.dindor.mapper.TravailleurMapper;
import com.poly.dindor.repository.TravailleurRepository;
import com.poly.dindor.util.ServiceUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TravailleurService {

    private final TravailleurRepository travailleurRepository;

    @Transactional
    public TravailleurResponse create(TravailleurRequest request) {
        if (travailleurRepository.existsByCin(request.getCin())) {
            throw new IllegalArgumentException("Un travailleur avec ce CIN existe déjà");
        }
        Travailleur entity = TravailleurMapper.toEntity(request);
        return TravailleurMapper.toResponse(travailleurRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<TravailleurResponse> getAll() {
        return travailleurRepository.findAll().stream()
                .map(TravailleurMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TravailleurResponse getById(Long id) {
        return TravailleurMapper.toResponse(ServiceUtils.findByIdOrThrow(travailleurRepository, id, "Travailleur"));
    }

    @Transactional
    public TravailleurResponse update(Long id, TravailleurRequest request) {
        Travailleur entity = ServiceUtils.findByIdOrThrow(travailleurRepository, id, "Travailleur");
        if (!entity.getCin().equals(request.getCin())
                && travailleurRepository.existsByCin(request.getCin())) {
            throw new IllegalArgumentException("Un travailleur avec ce CIN existe déjà");
        }
        TravailleurMapper.updateEntity(entity, request);
        return TravailleurMapper.toResponse(travailleurRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        ServiceUtils.deleteByIdOrThrow(travailleurRepository, id, "Travailleur");
    }
}
