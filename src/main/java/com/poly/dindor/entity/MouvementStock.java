package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "mouvement_stock")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MouvementStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id", nullable = false)
    private Article article;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_mouvement", length = 25, nullable = false)
    private TypeMouvement typeMouvement;

    @Column(name = "quantite", precision = 15, scale = 3, nullable = false)
    private BigDecimal quantite;

    @Column(name = "prix_unitaire", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal prixUnitaire = BigDecimal.ZERO;

    @Column(name = "pump_avant", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal pumpAvant = BigDecimal.ZERO;

    @Column(name = "pump_apres", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal pumpApres = BigDecimal.ZERO;

    @Column(name = "stock_avant", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal stockAvant = BigDecimal.ZERO;

    @Column(name = "stock_apres", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal stockApres = BigDecimal.ZERO;

    @Column(name = "reference_document", length = 100)
    private String referenceDocument;

    @Column(name = "notes", length = 500)
    private String notes;

    @CreationTimestamp
    @Column(name = "date_operation", updatable = false)
    private LocalDateTime dateOperation;

    public enum TypeMouvement {
        ENTREE_ACHAT,
        SORTIE_VENTE,
        SORTIE_DERIVE,         // sortie du produit source lors d'une vente d'article dérivé
        ANNULATION_VENTE,      // remise en stock suite à suppression d'une facture client
        AJUSTEMENT_POSITIF,
        AJUSTEMENT_NEGATIF,
        INVENTAIRE
    }
}
