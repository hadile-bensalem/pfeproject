package com.poly.dindor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrigineRequest {

    @NotNull(message = "Le code est obligatoire")
    private Integer code;

    @NotBlank(message = "La désignation est obligatoire")
    @Size(max = 255, message = "La désignation ne doit pas dépasser 255 caractères")
    private String designation;
}
