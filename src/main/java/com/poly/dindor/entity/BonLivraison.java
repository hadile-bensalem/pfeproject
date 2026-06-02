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
@Table(name = "bon_livraison", indexes = {
    @Index(name = "idx_bl_date", columnList = "date_bl"),
    @Index(name = "idx_bl_client", columnList = "client_id"),
    @Index(name = "idx_bl_etat_paiement", columnList = "etat_paiement")
})
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BonLivraison {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_bl", unique = true, length = 30, nullable = false)
    private String numeroBL;

    @Column(name = "date_bl", nullable = false)
    private LocalDate dateBL;

    // ── Client (FK optionnel + snapshots pour impression) ─────────────────
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "client_id")
    private Client client;

    @Column(name = "client_code", length = 50)
    private String clientCode;

    @Column(name = "client_nom", length = 255)
    private String clientNom;

    @Column(name = "client_adresse", length = 500)
    private String clientAdresse;

    @Column(name = "client_mf", length = 50)
    private String clientMF;

    // ── Transporteur ──────────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transporteur_id")
    private Transporteur transporteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicule_id")
    private Vehicule vehicule;

    @Column(name = "transporteur_nom", length = 255)
    private String transporteurNom;

    @Column(name = "vehicule_numero", length = 50)
    private String vehiculeNumero;

    // ── Solde client capturé à la création du BL ──────────────────────────
    @Column(name = "solde_sur_bl", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal soldeSurBL = BigDecimal.ZERO;

    // ── Lignes ────────────────────────────────────────────────────────────
    @OneToMany(mappedBy = "bonLivraison", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordre ASC")
    @Builder.Default
    private List<BonLivraisonLigne> lignes = new ArrayList<>();

    @OneToOne(mappedBy = "bonLivraison", cascade = CascadeType.ALL, orphanRemoval = true)
    private PaiementVente paiement;

    // ── Totaux ────────────────────────────────────────────────────────────
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
    private BigDecimal timbreFiscal = BigDecimal.ZERO;

    @Column(name = "net_a_payer", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal netAPayer = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "etat_paiement", length = 20)
    @Builder.Default
    private EtatPaiement etatPaiement = EtatPaiement.EN_ATTENTE;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(name = "date_modification", nullable = true)
    private LocalDateTime dateModification;

    public enum EtatPaiement { EN_ATTENTE, PARTIEL, PAYE }

    public void recalculerTotaux() {
        // Force-compute each ligne's derived fields before aggregating,
        // because @PrePersist hasn't fired yet at mapper time.
        lignes.forEach(BonLivraisonLigne::calculer);

        totalBrut = lignes.stream()
                .map(l -> l.getPrixUnitaireHT().multiply(l.getQuantite()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);
        totalRemise = lignes.stream()
                .map(BonLivraisonLigne::getMontantRemise)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);
        totalHT = lignes.stream()
                .map(BonLivraisonLigne::getTotalHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);
        totalTVA = lignes.stream()
                .map(BonLivraisonLigne::getMontantTVA)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);
        netAPayer = totalHT.add(totalTVA).add(timbreFiscal)
                .setScale(3, RoundingMode.HALF_UP);
    }
}
