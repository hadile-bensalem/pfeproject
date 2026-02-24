package com.poly.dindor.service;

import com.poly.dindor.dto.request.PointageRequest;
import com.poly.dindor.dto.response.PointageResponse;
import com.poly.dindor.entity.Pointage;
import com.poly.dindor.entity.Travailleur;
import com.poly.dindor.mapper.PointageMapper;
import com.poly.dindor.repository.PointageRepository;
import com.poly.dindor.repository.TravailleurRepository;
import com.poly.dindor.util.ServiceUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PointageService {

    private final PointageRepository pointageRepository;
    private final TravailleurRepository travailleurRepository;

    @Transactional
    public PointageResponse create(Long travailleurId, PointageRequest request) {
        Travailleur travailleur = ServiceUtils.findByIdOrThrow(travailleurRepository, travailleurId, "Travailleur");
        if (request.getDatePointage().getDayOfWeek() == DayOfWeek.SUNDAY) {
            throw new IllegalArgumentException("Le pointage ne peut pas être effectué le dimanche");
        }
        Pointage entity = PointageMapper.toEntity(request);
        entity.setTravailleur(travailleur);
        return PointageMapper.toResponse(pointageRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<PointageResponse> getHistorique(Long travailleurId) {
        ServiceUtils.findByIdOrThrow(travailleurRepository, travailleurId, "Travailleur");
        return pointageRepository.findByTravailleurIdOrderByDatePointageDesc(travailleurId).stream()
                .map(PointageMapper::toResponse)
                .toList();
    }
}
