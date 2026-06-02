package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "paiements_client")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaiementClient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "montant", precision = 15, scale = 3, nullable = false)
    private BigDecimal montant;

    @Column(name = "date_paiement", nullable = false)
    private LocalDate datePaiement;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "bl_numeros", columnDefinition = "TEXT")
    private String blNumeros;

    public enum ModePaiement { ESPECE, CHEQUE, TRAITE }

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "mode_paiement", length = 20, nullable = false,
            columnDefinition = "varchar(20) not null default 'ESPECE' check (mode_paiement in ('ESPECE','CHEQUE','TRAITE'))")
    private ModePaiement modePaiement = ModePaiement.ESPECE;

    @Column(name = "numero_paiement", length = 50)
    private String numeroPaiement;

    @Column(name = "echeance")
    private LocalDate echeance;

    @Column(name = "banque", length = 100)
    private String banque;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;
}
