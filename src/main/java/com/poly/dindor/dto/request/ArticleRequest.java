package com.poly.dindor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArticleRequest {

    @NotBlank(message = "Le code article est obligatoire")
    @Size(max = 50, message = "Le code article ne doit pas dépasser 50 caractères")
    private String codeArticle;

    @NotBlank(message = "La désignation est obligatoire")
    @Size(max = 500, message = "La désignation ne doit pas dépasser 500 caractères")
    private String designation;

    @NotBlank(message = "L'unité est obligatoire")
    @Size(max = 50, message = "L'unité ne doit pas dépasser 50 caractères")
    private String unite;

    @Size(max = 255)
    private String famille;

    @Size(max = 255)
    private String origine;

    private BigDecimal tauxConversion;

    private BigDecimal prixAchatHT;

    private BigDecimal prixVente;

    private BigDecimal tva;

    private BigDecimal stock1;

    private BigDecimal stock2;

    private BigDecimal pump;

    private Boolean qteNbre;

    private Boolean autreIndir;

    private Boolean stockezBlock;
}
