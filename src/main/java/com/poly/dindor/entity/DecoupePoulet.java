package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "decoupe_poulet", indexes = {
    @Index(name = "idx_decoupe_date", columnList = "date_decoupe"),
    @Index(name = "idx_decoupe_lot",  columnList = "numero_lot")
})
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DecoupePoulet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_decoupe", nullable = false)
    private LocalDate dateDecoupe;

    @Column(name = "numero_lot", length = 50)
    private String numeroLot;

    @Column(name = "qte_achetee", precision = 15, scale = 3, nullable = false)
    private BigDecimal qteAchetee;

    @Column(name = "prix_unitaire_achat", precision = 15, scale = 3, nullable = false)
    private BigDecimal prixUnitaireAchat;

    @Column(name = "total_achat", precision = 15, scale = 3, nullable = false)
    private BigDecimal totalAchat;

    @Column(name = "produit_calcule", length = 20, nullable = false)
    private String produitCalcule;

    @Builder.Default
    @OneToMany(mappedBy = "decoupe", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DecoupePouletLigne> lignes = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime dateModification;
}
