package com.poly.dindor.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointageRequest {

    @NotNull(message = "La date de pointage est obligatoire")
    private LocalDate datePointage;

    @NotNull(message = "Les heures travaillées sont obligatoires")
    @Min(value = 0, message = "Les heures travaillées doivent être positives ou nulles")
    @Max(value = 24, message = "Les heures travaillées ne doivent pas dépasser 24")
    private Double heuresTravaillees;

    @NotNull(message = "Le rendement journalier est obligatoire")
    @DecimalMin(value = "0.5", message = "Le rendement doit être au moins 0.5")
    @DecimalMax(value = "2.0", message = "Le rendement ne doit pas dépasser 2.0")
    private Double rendementJour;

    @Size(max = 1000, message = "Les observations ne doivent pas dépasser 1000 caractères")
    private String observations;
}
