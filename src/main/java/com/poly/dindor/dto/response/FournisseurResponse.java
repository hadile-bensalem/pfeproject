package com.poly.dindor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FournisseurResponse {

    private Long id;
    private String matricule;
    private String raisonSociale;
    private String adresse;
    private String codeTVA;
    private String telephone1;
    private String telephone2;
    private String email;
    private String responsableContact;
    private String devise;
    private String observations;
    private Boolean avecRS;
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
}

