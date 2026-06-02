package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "articles", indexes = {
    @Index(name = "idx_article_designation", columnList = "designation"),
    @Index(name = "idx_article_famille", columnList = "famille")
})
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

    @Column(nullable = false, name = "stock_minimum")
    @Builder.Default
    private BigDecimal stockMinimum = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private Boolean qteNbre = Boolean.FALSE;

    @Column(nullable = false)
    @Builder.Default
    private Boolean autreIndir = Boolean.FALSE;

    @Column(nullable = false)
    @Builder.Default
    private Boolean stockezBlock = Boolean.FALSE;

    /** Code de l'article source si cet article est un produit dérivé/transformé.
     *  Ex : chawarma → codeArticleSource = "CUISSE_DINDE".
     *  NULL = article standard (matière première ou produit acheté directement). */
    @Column(name = "code_article_source", length = 50)
    private String codeArticleSource;

    /** Produit spécial (cuisse, poulet…) : base de transfo — le taux % se saisit sur chaque facture d'achat. */
    @Column(name = "produit_special", nullable = false)
    @Builder.Default
    private Boolean produitSpecial = Boolean.FALSE;

    /** Stock physiquement confirmé (achats validés). Anciennement stock1 = même colonne. */
    @Column(name = "stock_reserve", precision = 10, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal stockReserve = BigDecimal.ZERO;

    /** Quantité pré-engagée par factures achat en brouillon (pas encore validées). */
    @Column(name = "stock_en_attente", precision = 10, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal stockEnAttente = BigDecimal.ZERO;

    /** Prix catalogue public (visible sur le portail client non connecté). */
    @Column(name = "prix_public", precision = 10, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal prixPublic = BigDecimal.ZERO;

    /** Date de péremption indicative pour cet article (optionnelle). */
    @Column(name = "date_peremption")
    private LocalDate datePeremption;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime dateModification;
}
