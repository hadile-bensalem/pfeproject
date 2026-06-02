package com.poly.dindor.dto.response;

import lombok.Data;

@Data
public class TransporteurResponse {
    private Long   id;
    private String nom;
    private String telephone;
    private String cin;
    private boolean actif;
}
