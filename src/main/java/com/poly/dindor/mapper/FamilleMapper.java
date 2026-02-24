package com.poly.dindor.mapper;

import com.poly.dindor.dto.request.FamilleRequest;
import com.poly.dindor.dto.response.FamilleResponse;
import com.poly.dindor.entity.Famille;

public final class FamilleMapper {

    private FamilleMapper() {
    }

    public static Famille toEntity(FamilleRequest request) {
        if (request == null) {
            return null;
        }
        return Famille.builder()
                .code(request.getCode())
                .nom(request.getNom())
                .build();
    }

    public static void updateEntity(Famille entity, FamilleRequest request) {
        if (entity == null || request == null) {
            return;
        }
        entity.setCode(request.getCode());
        entity.setNom(request.getNom());
    }

    public static FamilleResponse toResponse(Famille entity) {
        if (entity == null) {
            return null;
        }
        return FamilleResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .nom(entity.getNom())
                .dateCreation(entity.getDateCreation())
                .dateModification(entity.getDateModification())
                .build();
    }
}
