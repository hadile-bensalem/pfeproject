package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "fournisseurs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fournisseur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String matricule;

    @Column(nullable = false, length = 255)
    private String raisonSociale;

    @Column(length = 500)
    private String adresse;

    @Column(length = 50)
    private String codeTVA;

    @Column(length = 30)
    private String telephone1;

    @Column(length = 30)
    private String telephone2;

    @Column(length = 150)
    private String email;

    @Column(length = 150)
    private String responsableContact;

    @Column(length = 20)
    private String devise;

    @Column(length = 1000)
    private String observations;

    @Column(nullable = false)
    @Builder.Default
    private Boolean avecRS = Boolean.FALSE;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime dateModification;
}

