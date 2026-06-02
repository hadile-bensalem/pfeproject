package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "clients", indexes = {
    @Index(name = "idx_client_nom", columnList = "nom"),
    @Index(name = "idx_client_actif", columnList = "actif"),
    @Index(name = "idx_client_type", columnList = "type_client")
})
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    @Column(name = "version", nullable = false, columnDefinition = "bigint DEFAULT 0")
    @Builder.Default
    private Long version = 0L;

    @Column(name = "code_client", unique = true, nullable = false, length = 20)
    private String codeClient;

    @Builder.Default
    @Column(name = "type_client", length = 20, nullable = false)
    private String typeClient = "AUTRE"; // ETATIQUE, CLIENT_DIVERS, AUTRE, AMBULANT

    @Column(name = "nom", nullable = false, length = 255)
    private String nom;

    @Column(name = "responsable", length = 200)
    private String responsable;

    @Column(name = "telephone", length = 30)
    private String telephone;

    @Column(name = "telephone2", length = 30)
    private String telephone2;

    @Column(name = "fax", length = 30)
    private String fax;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "adresse", length = 500)
    private String adresse;

    @Column(name = "ville", length = 100)
    private String ville;

    @Column(name = "zone", length = 100)
    private String zone;

    @Column(name = "matricule_fiscal", length = 50)
    private String matriculeFiscal;

    @Column(name = "code_tva", length = 50)
    private String codeTVA;

    @Column(name = "tva", precision = 5, scale = 2)
    private BigDecimal tva;

    @Builder.Default
    @Column(name = "prix_vente")
    private Integer prixVente = 1;

    @Column(name = "plafond", precision = 15, scale = 3)
    private BigDecimal plafond;

    @Builder.Default
    @Column(name = "devise", length = 10)
    private String devise = "DT";

    @Column(name = "date_inscription")
    private LocalDate dateInscription;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @Column(name = "actif", nullable = false, columnDefinition = "boolean DEFAULT true")
    private Boolean actif = true;

    @Builder.Default
    @Column(name = "solde_total_du", precision = 15, scale = 3)
    private BigDecimal soldeTotalDu = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;
}
