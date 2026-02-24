package com.poly.dindor.mapper;

import com.poly.dindor.dto.request.OrigineRequest;
import com.poly.dindor.dto.response.OrigineResponse;
import com.poly.dindor.entity.Origine;

public final class OrigineMapper {

    private OrigineMapper() {
    }

    public static Origine toEntity(OrigineRequest request) {
        if (request == null) {
            return null;
        }
        return Origine.builder()
                .code(request.getCode())
                .designation(request.getDesignation())
                .build();
    }

    public static void updateEntity(Origine entity, OrigineRequest request) {
        if (entity == null || request == null) {
            return;
        }
        entity.setCode(request.getCode());
        entity.setDesignation(request.getDesignation());
    }

    public static OrigineResponse toResponse(Origine entity) {
        if (entity == null) {
            return null;
        }
        return OrigineResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .designation(entity.getDesignation())
                .dateCreation(entity.getDateCreation())
                .dateModification(entity.getDateModification())
                .build();
    }
}
