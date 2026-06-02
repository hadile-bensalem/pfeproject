package com.poly.dindor.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
public class AchatExcelImportResponse {

    @Builder.Default
    private int facturesImportees = 0;

    @Builder.Default
    private int lignesIgnorees = 0;

    @Builder.Default
    private List<String> avertissements = new ArrayList<>();

    @Builder.Default
    private List<String> erreurs = new ArrayList<>();
}
