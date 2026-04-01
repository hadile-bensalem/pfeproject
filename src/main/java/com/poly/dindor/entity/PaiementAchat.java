package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "paiement_achat")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaiementAchat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_achat_id", nullable = false)
    private FactureAchat factureAchat;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode_paiement", length = 20)
    private ModePaiement modePaiement;

    @Enumerated(EnumType.STRING)
    @Column(name = "sous_mode", length = 30)
    private SousMode sousMode;

    @Column(name = "montant_paye", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal montantPaye = BigDecimal.ZERO;

    @Column(name = "montant_reste", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal montantReste = BigDecimal.ZERO;

    /** Date d'échéance (traite) */
    @Column(name = "date_echeance")
    private LocalDate dateEcheance;

    @Column(name = "numero_traite", length = 50)
    private String numeroTraite;

    /** Date limite de remboursement (crédit) */
    @Column(name = "date_limite_credit")
    private LocalDate dateLimiteCredit;

    @Column(name = "avec_retenue")
    @Builder.Default
    private Boolean avecRetenue = Boolean.FALSE;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    public enum ModePaiement { ESPECES, AUTRE }
    public enum SousMode { TOUT_ESPECES, ACOMPTE_TRAITE, ACOMPTE_CREDIT }
}
