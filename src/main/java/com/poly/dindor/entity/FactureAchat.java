package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "facture_achat")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FactureAchat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_facture", unique = true, length = 30, nullable = false)
    private String numeroFacture;

    @Column(name = "date_facture", nullable = false)
    private LocalDate dateFacture;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fournisseur_id", nullable = false)
    private Fournisseur fournisseur;

    @OneToMany(mappedBy = "factureAchat", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordre ASC")
    @Builder.Default
    private List<FactureAchatLigne> lignes = new ArrayList<>();

    @OneToOne(mappedBy = "factureAchat", cascade = CascadeType.ALL, orphanRemoval = true)
    private PaiementAchat paiement;

    @Column(name = "total_brut", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal totalBrut = BigDecimal.ZERO;

    @Column(name = "total_remise", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal totalRemise = BigDecimal.ZERO;

    @Column(name = "total_ht", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal totalHT = BigDecimal.ZERO;

    @Column(name = "total_tva", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal totalTVA = BigDecimal.ZERO;

    @Column(name = "timbre_fiscal", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal timbreFiscal = new BigDecimal("1.000");

    @Column(name = "net_a_payer", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal netAPayer = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", length = 20)
    @Builder.Default
    private StatutFacture statut = StatutFacture.BROUILLON;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    public enum StatutFacture { BROUILLON, VALIDEE }

    public void recalculerTotaux() {
        totalBrut = lignes.stream()
            .map(l -> l.getPrixUnitaireHT().multiply(l.getQuantite()))
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(3, RoundingMode.HALF_UP);
        totalRemise = lignes.stream()
            .map(FactureAchatLigne::getMontantRemise)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(3, RoundingMode.HALF_UP);
        totalHT = lignes.stream()
            .map(FactureAchatLigne::getTotalHT)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(3, RoundingMode.HALF_UP);
        totalTVA = lignes.stream()
            .map(FactureAchatLigne::getMontantTVA)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(3, RoundingMode.HALF_UP);
        netAPayer = totalHT.add(totalTVA).add(timbreFiscal)
            .setScale(3, RoundingMode.HALF_UP);
    }
}
