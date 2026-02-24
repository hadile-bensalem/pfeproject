package com.poly.dindor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArticleResponse {

    private Long id;
    private String codeArticle;
    private String designation;
    private String unite;
    private String famille;
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
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
}
