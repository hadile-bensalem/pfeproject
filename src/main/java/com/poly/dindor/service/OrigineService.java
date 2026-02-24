package com.poly.dindor.service;

import com.poly.dindor.dto.request.OrigineRequest;
import com.poly.dindor.dto.response.OrigineResponse;
import com.poly.dindor.entity.Origine;
import com.poly.dindor.mapper.OrigineMapper;
import com.poly.dindor.repository.OrigineRepository;
import com.poly.dindor.util.ServiceUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrigineService {

    private final OrigineRepository origineRepository;

    @Transactional
    public OrigineResponse create(OrigineRequest request) {
        if (origineRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Une origine avec ce code existe déjà");
        }
        return OrigineMapper.toResponse(origineRepository.save(OrigineMapper.toEntity(request)));
    }

    @Transactional(readOnly = true)
    public List<OrigineResponse> getAll() {
        return origineRepository.findAll().stream().map(OrigineMapper::toResponse).toList();
    }

    @Transactional
    public OrigineResponse update(Long id, OrigineRequest request) {
        Origine e = ServiceUtils.findByIdOrThrow(origineRepository, id, "Origine");
        if (!e.getCode().equals(request.getCode()) && origineRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Une origine avec ce code existe déjà");
        }
        OrigineMapper.updateEntity(e, request);
        return OrigineMapper.toResponse(origineRepository.save(e));
    }

    @Transactional
    public void delete(Long id) {
        ServiceUtils.deleteByIdOrThrow(origineRepository, id, "Origine");
    }
}
