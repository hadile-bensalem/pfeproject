package com.poly.dindor.config;

import com.poly.dindor.entity.Fournisseur;
import com.poly.dindor.entity.RetenueSource;
import com.poly.dindor.entity.RetenueSourceLigne;
import com.poly.dindor.repository.FournisseurRepository;
import com.poly.dindor.repository.RetenueSourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Génère des données de test pour le module Retenue à la Source.
 * Exécuté au démarrage uniquement si la table retenue_source est vide.
 * Supprimez cette classe (ou décommentez le guard) en production.
 */
@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class RetenueTestDataInitializer implements CommandLineRunner {

    private final FournisseurRepository fournisseurRepository;
    private final RetenueSourceRepository retenueRepository;

    @Override
    public void run(String... args) {
        if (retenueRepository.count() > 0) {
            log.info("[RetenueTestData] Données déjà présentes — initialisation ignorée.");
            return;
        }

        // ── Fournisseurs fictifs ──────────────────────────────────────────
        Fournisseur f1 = fournisseurRepository.findAll().stream()
                .filter(f -> f.getMatricule().equals("1234567ABC"))
                .findFirst()
                .orElseGet(() -> fournisseurRepository.save(Fournisseur.builder()
                        .matricule("1234567ABC")
                        .raisonSociale("ALIMENTS DU SUD SARL")
                        .adresse("Zone Industrielle, Route de Sfax, Mahdia 5100")
                        .codeTVA("A")
                        .telephone1("73 200 111")
                        .telephone2("98 765 432")
                        .email("contact@alimentsdusud.tn")
                        .responsableContact("M. Karim Belhaj")
                        .devise("DT")
                        .observations("Fournisseur principal aliments volaille")
                        .avecRS(Boolean.TRUE)
                        .build()));

        Fournisseur f2 = fournisseurRepository.findAll().stream()
                .filter(f -> f.getMatricule().equals("9876543XYZ"))
                .findFirst()
                .orElseGet(() -> fournisseurRepository.save(Fournisseur.builder()
                        .matricule("9876543XYZ")
                        .raisonSociale("MATÉRIAUX AGRICOLES NORD")
                        .adresse("Avenue Habib Bourguiba, Béja 9000")
                        .codeTVA("B")
                        .telephone1("78 450 200")
                        .email("info@agrinord.tn")
                        .responsableContact("Mme. Sonia Trabelsi")
                        .devise("DT")
                        .avecRS(Boolean.TRUE)
                        .build()));

        // ── Certificat 1 — Multi-factures (fournisseur 1) ─────────────────
        RetenueSource rs1 = buildCertificat(
                "RS-2025-001",
                LocalDate.of(2025, 3, 15),
                "Ksibet El Médiouni",
                f1,
                List.of(
                        ligne("FAC-2025-0101", "12500.000", "1.000", 1),
                        ligne("FAC-2025-0102", "8750.500", "1.000", 2),
                        ligne("FAC-2025-0103", "20000.000", "1.000", 3)
                )
        );
        retenueRepository.save(rs1);

        // ── Certificat 2 — Taux 3% (fournisseur 2) ───────────────────────
        RetenueSource rs2 = buildCertificat(
                "RS-2025-002",
                LocalDate.of(2025, 4, 2),
                "Tunis",
                f2,
                List.of(
                        ligne("FAC-2025-0210", "45000.000", "3.000", 1),
                        ligne("FAC-2025-0211", "15600.750", "3.000", 2)
                )
        );
        retenueRepository.save(rs2);

        // ── Certificat 3 — Taux 5% (fournisseur 1, récent) ───────────────
        RetenueSource rs3 = buildCertificat(
                "RS-2025-003",
                LocalDate.of(2025, 5, 20),
                "Monastir",
                f1,
                List.of(
                        ligne("FAC-2025-0350", "33250.000", "5.000", 1),
                        ligne("FAC-2025-0351", "11800.000", "5.000", 2),
                        ligne("FAC-2025-0352",  "9400.250", "5.000", 3),
                        ligne("FAC-2025-0353",  "6120.000", "5.000", 4)
                )
        );
        retenueRepository.save(rs3);

        log.info("[RetenueTestData] 3 certificats de retenue à la source créés (RS-2025-001 à RS-2025-003).");
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private RetenueSource buildCertificat(String numero, LocalDate date, String lieu,
                                          Fournisseur fournisseur,
                                          List<RetenueSourceLigne> lignes) {
        RetenueSource rs = RetenueSource.builder()
                .numeroDocument(numero)
                .dateRetenue(date)
                .lieuRetenue(lieu)
                .fournisseur(fournisseur)
                .build();

        lignes.forEach(l -> {
            l.setRetenueSource(rs);
            l.calculer();
            rs.getLignes().add(l);
        });

        rs.recalculerTotaux();
        return rs;
    }

    private RetenueSourceLigne ligne(String numeroFacture, String montantBrut,
                                     String taux, int ordre) {
        return RetenueSourceLigne.builder()
                .numeroFacture(numeroFacture)
                .montantBrut(new BigDecimal(montantBrut))
                .tauxRetenue(new BigDecimal(taux))
                .ordre(ordre)
                .build();
    }
}
