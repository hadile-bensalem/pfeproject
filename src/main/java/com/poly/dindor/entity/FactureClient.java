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
@Table(name = "facture_client", indexes = {
    @Index(name = "idx_fc_numero", columnList = "numero_facture"),
    @Index(name = "idx_fc_date", columnList = "date_facture"),
    @Index(name = "idx_fc_client", columnList = "client_id"),
    @Index(name = "idx_fc_etat_paiement", columnList = "etat_paiement")
})
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FactureClient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_facture", unique = true, length = 30, nullable = false)
    private String numeroFacture;

    @Column(name = "date_facture", nullable = false)
    private LocalDate dateFacture;

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

    // ── Solde client capturé à la création de la facture ──────────────────
    @Column(name = "solde_sur_facture", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal soldeSurFacture = BigDecimal.ZERO;

    // ── Lignes ────────────────────────────────────────────────────────────
    @OneToMany(mappedBy = "factureClient", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordre ASC")
    @Builder.Default
    private List<FactureClientLigne> lignes = new ArrayList<>();

    @OneToOne(mappedBy = "factureClient", cascade = CascadeType.ALL, orphanRemoval = true)
    private PaiementFactureClient paiement;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "type_document", length = 20)
    @Builder.Default
    private TypeDocument typeDocument = TypeDocument.FACTURE;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(name = "date_modification", nullable = true)
    private LocalDateTime dateModification;

    public enum EtatPaiement  { EN_ATTENTE, PARTIEL, PAYE }
    public enum TypeDocument  { FACTURE, BON_LIVRAISON }

    public void recalculerTotaux() {
        // Force-compute each ligne's derived fields before aggregating,
        // because @PrePersist hasn't fired yet at mapper time.
        lignes.forEach(FactureClientLigne::calculer);

        totalBrut = lignes.stream()
                .map(l -> l.getPrixUnitaireHT().multiply(l.getQuantite()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);
        totalRemise = lignes.stream()
                .map(FactureClientLigne::getMontantRemise)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);
        totalHT = lignes.stream()
                .map(FactureClientLigne::getTotalHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);
        totalTVA = lignes.stream()
                .map(FactureClientLigne::getMontantTVA)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);
        netAPayer = totalHT.add(totalTVA).add(timbreFiscal)
                .setScale(3, RoundingMode.HALF_UP);
    }
}
