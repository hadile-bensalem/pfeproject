package com.poly.dindor.service;

import com.poly.dindor.dto.request.FamilleRequest;
import com.poly.dindor.dto.response.FamilleResponse;
import com.poly.dindor.entity.Famille;
import com.poly.dindor.mapper.FamilleMapper;
import com.poly.dindor.repository.FamilleRepository;
import com.poly.dindor.util.ServiceUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FamilleService {

    private final FamilleRepository familleRepository;

    @Transactional
    public FamilleResponse create(FamilleRequest request) {
        if (familleRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Une famille avec ce code existe déjà");
        }
        return FamilleMapper.toResponse(familleRepository.save(FamilleMapper.toEntity(request)));
    }

    @Transactional(readOnly = true)
    public List<FamilleResponse> getAll() {
        return familleRepository.findAll().stream().map(FamilleMapper::toResponse).toList();
    }

    @Transactional
    public FamilleResponse update(Long id, FamilleRequest request) {
        Famille e = ServiceUtils.findByIdOrThrow(familleRepository, id, "Famille");
        if (!e.getCode().equals(request.getCode()) && familleRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Une famille avec ce code existe déjà");
        }
        FamilleMapper.updateEntity(e, request);
        return FamilleMapper.toResponse(familleRepository.save(e));
    }

    @Transactional
    public void delete(Long id) {
        ServiceUtils.deleteByIdOrThrow(familleRepository, id, "Famille");
    }
}
