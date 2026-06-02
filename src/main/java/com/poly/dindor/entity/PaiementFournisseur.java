package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "paiements_fournisseur")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaiementFournisseur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fournisseur_id", nullable = false)
    private Fournisseur fournisseur;

    @Column(name = "montant", precision = 15, scale = 3, nullable = false)
    private BigDecimal montant;

    @Column(name = "date_paiement", nullable = false)
    private LocalDate datePaiement;

    public enum ModePaiement { ESPECE, CHEQUE, TRAITE }

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "mode_paiement", length = 20, nullable = false)
    private ModePaiement modePaiement = ModePaiement.ESPECE;

    /** N° de chèque ou de traite */
    @Column(name = "numero_paiement", length = 50)
    private String numeroPaiement;

    /** Date d'échéance (chèque / traite) */
    @Column(name = "echeance")
    private LocalDate echeance;

    @Column(name = "banque", length = 100)
    private String banque;

    @Column(name = "remarque", length = 500)
    private String remarque;

    /** Numéro de facture de référence (optionnel) */
    @Column(name = "numero_facture", length = 50)
    private String numeroFacture;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;
}
