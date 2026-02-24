package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "articles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String codeArticle;

    @Column(nullable = false, length = 500)
    private String designation;

    @Column(nullable = false, length = 50)
    private String unite;

    @Column(length = 255)
    private String famille;

    @Column(length = 255)
    private String origine;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal tauxConversion = BigDecimal.ONE;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal prixAchatHT = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal prixVente = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal tva = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal stock1 = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal stock2 = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal pump = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private Boolean qteNbre = Boolean.FALSE;

    @Column(nullable = false)
    @Builder.Default
    private Boolean autreIndir = Boolean.FALSE;

    @Column(nullable = false)
    @Builder.Default
    private Boolean stockezBlock = Boolean.FALSE;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime dateModification;
}
