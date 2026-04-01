package com.poly.dindor.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ClientResponse {
    private Long id;
    private String codeClient;
    private String nom;
    private String adresse;
    private String telephone;
    private String email;
    private String observations;
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
}
