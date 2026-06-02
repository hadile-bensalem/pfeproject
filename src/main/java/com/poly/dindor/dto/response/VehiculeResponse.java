package com.poly.dindor.dto.response;

import lombok.Data;

@Data
public class VehiculeResponse {
    private Long   id;
    private String immatriculation;
    private String marque;
    private boolean actif;
}
