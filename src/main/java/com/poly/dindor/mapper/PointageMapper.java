package com.poly.dindor.mapper;

import com.poly.dindor.dto.request.PointageRequest;
import com.poly.dindor.dto.response.PointageResponse;
import com.poly.dindor.entity.Pointage;

public final class PointageMapper {

    private PointageMapper() {
    }

    public static Pointage toEntity(PointageRequest request) {
        if (request == null) {
            return null;
        }
        return Pointage.builder()
                .datePointage(request.getDatePointage())
                .heuresTravaillees(request.getHeuresTravaillees())
                .rendementJour(request.getRendementJour())
                .observations(request.getObservations())
                .build();
    }

    public static PointageResponse toResponse(Pointage entity) {
        if (entity == null) {
            return null;
        }
        return PointageResponse.builder()
                .id(entity.getId())
                .travailleurId(entity.getTravailleur() != null ? entity.getTravailleur().getId() : null)
                .datePointage(entity.getDatePointage())
                .heuresTravaillees(entity.getHeuresTravaillees())
                .rendementJour(entity.getRendementJour())
                .observations(entity.getObservations())
                .dateCreation(entity.getDateCreation())
                .dateModification(entity.getDateModification())
                .build();
    }
}
