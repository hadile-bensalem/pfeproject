package com.poly.dindor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TransporteurRequest {

    @NotBlank(message = "Le nom du transporteur est obligatoire")
    @Size(max = 150)
    private String nom;

    @Size(max = 30)
    private String telephone;

    @Size(max = 20)
    private String cin;
}
