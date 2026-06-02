package com.poly.dindor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VehiculeRequest {

    @NotBlank(message = "L'immatriculation est obligatoire")
    @Size(max = 30)
    private String immatriculation;

    @Size(max = 100)
    private String marque;
}
