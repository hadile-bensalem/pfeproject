package com.poly.dindor.dto.response;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

@Data
public class PredictionPointResponse {
    private int horizon;
    private String date;

    /** Python renvoie prix_predit, Angular attend prixPredit */
    @JsonAlias("prix_predit")
    private double prixPredit;

    @JsonAlias("prix_min")
    private double prixMin;

    @JsonAlias("prix_max")
    private double prixMax;
}
