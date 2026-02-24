package com.poly.dindor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointageResponse {

    private Long id;
    private Long travailleurId;
    private LocalDate datePointage;
    private Double heuresTravaillees;
    private Double rendementJour;
    private String observations;
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
}
