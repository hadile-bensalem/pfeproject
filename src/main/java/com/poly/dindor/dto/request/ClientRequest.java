package com.poly.dindor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClientRequest {

    @NotBlank(message = "Le code client est obligatoire")
    @Size(max = 50)
    private String codeClient;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 255)
    private String nom;

    @Size(max = 500)
    private String adresse;

    @Size(max = 30)
    private String telephone;

    @Size(max = 150)
    private String email;

    @Size(max = 1000)
    private String observations;
}
