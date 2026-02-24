package com.poly.dindor.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FournisseurRequest {

    @NotBlank(message = "La matricule est obligatoire")
    @Size(max = 50, message = "La matricule ne doit pas dépasser 50 caractères")
    private String matricule;

    @NotBlank(message = "La raison sociale est obligatoire")
    @Size(max = 255, message = "La raison sociale ne doit pas dépasser 255 caractères")
    private String raisonSociale;

    @Size(max = 500, message = "L'adresse ne doit pas dépasser 500 caractères")
    private String adresse;

    @Size(max = 50, message = "Le code TVA ne doit pas dépasser 50 caractères")
    private String codeTVA;

    @Size(max = 30, message = "Le téléphone 1 ne doit pas dépasser 30 caractères")
    private String telephone1;

    @Size(max = 30, message = "Le téléphone 2 ne doit pas dépasser 30 caractères")
    private String telephone2;

    @Email(message = "L'email doit être valide")
    @Size(max = 150, message = "L'email ne doit pas dépasser 150 caractères")
    private String email;

    @Size(max = 150, message = "Le responsable ne doit pas dépasser 150 caractères")
    private String responsableContact;

    @Size(max = 20, message = "La devise ne doit pas dépasser 20 caractères")
    private String devise;

    @Size(max = 1000, message = "Les observations ne doivent pas dépasser 1000 caractères")
    private String observations;

    private Boolean avecRS;
}

