package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "paiement_facture_client")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaiementFactureClient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_client_id", nullable = false)
    private FactureClient factureClient;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode_paiement", length = 20, nullable = false)
    private ModePaiement modePaiement;

    @Column(name = "montant_paye", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal montantPaye = BigDecimal.ZERO;

    @Column(name = "montant_reste", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal montantReste = BigDecimal.ZERO;

    @Column(name = "date_limite_credit")
    private LocalDate dateLimiteCredit;

    public enum ModePaiement { ESPECES, CREDIT }
}
