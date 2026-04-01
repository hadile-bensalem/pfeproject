package com.poly.dindor.service;

import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import com.poly.dindor.config.CompanyProperties;
import com.poly.dindor.entity.Fournisseur;
import com.poly.dindor.entity.RetenueSource;
import com.poly.dindor.entity.RetenueSourceLigne;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Génère le PDF officiel "Certificat de Retenue à la Source" conforme
 * au modèle de la Direction Générale des Impôts (DGI) — Tunisie.
 *
 * Mise en page : A4 portrait, noir & blanc, sections A/B/C encadrées,
 * bilingue Français / Arabe, cases matricule fiscal individuelles.
 */
@Service
@RequiredArgsConstructor
public class RetenuePdfService {

    // ── Couleurs DGI (minimalistes, style gouvernemental) ──────────────────
    private static final DeviceRgb CLR_BLACK      = new DeviceRgb(0x00, 0x00, 0x00);
    private static final DeviceRgb CLR_SECTION_BG = new DeviceRgb(0xF0, 0xF0, 0xF0);
    private static final DeviceRgb CLR_HEADER_BG  = new DeviceRgb(0xE8, 0xE8, 0xE8);
    private static final DeviceRgb CLR_TOTAL_BG   = new DeviceRgb(0xD8, 0xD8, 0xD8);
    private static final DeviceRgb CLR_BOX_FILL   = new DeviceRgb(0xFF, 0xFF, 0xFF);
    private static final DeviceRgb CLR_GREY_LIGHT  = new DeviceRgb(0xF7, 0xF7, 0xF7);

    private static final SolidBorder BORDER_THIN   = new SolidBorder(CLR_BLACK, 0.5f);
    private static final SolidBorder BORDER_MEDIUM = new SolidBorder(CLR_BLACK, 1.0f);
    private static final SolidBorder BORDER_THICK  = new SolidBorder(CLR_BLACK, 1.5f);

    private static final DateTimeFormatter DATE_FR =
            DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.FRENCH);

    private final CompanyProperties company;
    private final RetenueSourceService retenueSourceService;

    // ══════════════════════════════════════════════════════════════════════
    // POINT D'ENTRÉE
    // ══════════════════════════════════════════════════════════════════════

    public byte[] generateCertificat(Long retenueSourceId) {
        RetenueSource rs = retenueSourceService.findByIdWithLignes(retenueSourceId);
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter   writer = new PdfWriter(baos);
            PdfDocument pdf    = new PdfDocument(writer);
            Document    doc    = new Document(pdf, PageSize.A4);
            doc.setMargins(25, 30, 25, 30);

            PdfFont bold    = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont oblique = PdfFontFactory.createFont(StandardFonts.HELVETICA_OBLIQUE);

            buildEnTete(doc, rs, bold, regular);
            doc.add(vspace(4));
            buildSectionA(doc, bold, regular);
            doc.add(vspace(3));
            buildSectionB(doc, rs, bold, regular);
            doc.add(vspace(3));
            buildSectionC(doc, rs.getFournisseur(), bold, regular);
            doc.add(vspace(6));
            buildPiedDePage(doc, rs, bold, regular, oblique);

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération PDF retenue à la source", e);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // EN-TÊTE — style DGI officiel
    // ══════════════════════════════════════════════════════════════════════

    private void buildEnTete(Document doc, RetenueSource rs,
                             PdfFont bold, PdfFont regular) {

        // ─ Ligne 1 : République + Ministère (bilingue) ──────────────────
        Table topRow = new Table(UnitValue.createPercentArray(new float[]{40, 20, 40}))
                .useAllAvailableWidth()
                .setBorder(Border.NO_BORDER);

        // Colonne gauche (FR)
        Cell left = new Cell()
                .setBorder(Border.NO_BORDER)
                .add(p("République Tunisienne", bold, 8.5f))
                .add(p("Ministère des Finances", regular, 8f))
                .add(p("Direction Générale des Impôts", regular, 7.5f));

        // Colonne centre — vide (espace pour armoiries éventuelles)
        Cell centre = new Cell().setBorder(Border.NO_BORDER);

        // Colonne droite (AR) — alignement droite
        Cell right = new Cell()
                .setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT)
                .add(p("الجمهورية التونسية", bold, 8.5f).setTextAlignment(TextAlignment.RIGHT))
                .add(p("وزارة المالية", regular, 8f).setTextAlignment(TextAlignment.RIGHT))
                .add(p("المديرية العامة للضرائب", regular, 7.5f).setTextAlignment(TextAlignment.RIGHT));

        topRow.addCell(left);
        topRow.addCell(centre);
        topRow.addCell(right);
        doc.add(topRow);

        doc.add(vspace(6));

        // ─ Ligne séparatrice ────────────────────────────────────────────
        doc.add(hRule());

        doc.add(vspace(4));

        // ─ Titre principal centré ─────────────────────────────────────
        // Encadré double-ligne style officiel
        Table titreBox = new Table(UnitValue.createPercentArray(new float[]{1}))
                .useAllAvailableWidth()
                .setBorderTop(BORDER_THICK)
                .setBorderBottom(BORDER_THICK)
                .setBorderLeft(Border.NO_BORDER)
                .setBorderRight(Border.NO_BORDER);

        Cell titreCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPaddingTop(6).setPaddingBottom(6)
                .add(p("CERTIFICAT DE RETENUE A LA SOURCE", bold, 13f)
                        .setTextAlignment(TextAlignment.CENTER))
                .add(p("شهادة الاقتطاع من المورد", bold, 11f)
                        .setTextAlignment(TextAlignment.CENTER));
        titreBox.addCell(titreCell);
        doc.add(titreBox);

        doc.add(vspace(5));

        // ─ N° certificat + Année (en-tête droite) ────────────────────
        String annee = rs.getDateRetenue() != null
                ? String.valueOf(rs.getDateRetenue().getYear()) : "____";
        String numDoc = nvl(rs.getNumeroDocument(), "________________");

        Table numRow = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .useAllAvailableWidth()
                .setBorder(Border.NO_BORDER);

        numRow.addCell(new Cell().setBorder(Border.NO_BORDER)
                .add(p("N° : " + numDoc, regular, 9f)));
        numRow.addCell(new Cell().setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT)
                .add(p("Année : " + annee, regular, 9f).setTextAlignment(TextAlignment.RIGHT)));
        doc.add(numRow);
    }

    // ══════════════════════════════════════════════════════════════════════
    // SECTION A — Identité du préleveur (notre société)
    // ══════════════════════════════════════════════════════════════════════

    private void buildSectionA(Document doc, PdfFont bold, PdfFont regular) {

        Table section = sectionBox();
        Cell content = sectionContent();

        // Titre de section
        content.add(sectionTitre("A", "Identité du préleveur", "هوية المقتطع", bold));
        content.add(vspace(5));

        // Matricule fiscal — ligne label + cases
        content.add(matriculeFiscalLabel(bold, regular));
        content.add(vspace(2));
        content.add(buildMatriculeCases(
                company.getMatriculeFiscal(),
                company.getCodeTva(),
                company.getCodeCategorie(),
                company.getNumeroEtablissement(),
                bold, regular));
        content.add(vspace(6));

        // Informations société
        content.add(fieldLine("Nom et Prénom ou Dénomination :",
                company.getDenomination(), bold, regular));
        content.add(vspace(4));
        content.add(fieldLine("Activité :",
                "Commerce et Commercialisation de Produits Volaille", bold, regular));
        content.add(vspace(4));
        content.add(fieldLine("Adresse :",
                company.getAdresse() + " — " + company.getVille(), bold, regular));

        section.addCell(content);
        doc.add(section);
    }

    // ══════════════════════════════════════════════════════════════════════
    // SECTION B — Montants payés et retenues opérées
    // ══════════════════════════════════════════════════════════════════════

    private void buildSectionB(Document doc, RetenueSource rs,
                               PdfFont bold, PdfFont regular) {

        Table section = sectionBox();
        Cell content  = sectionContent();

        content.add(sectionTitre("B",
                "Montants des sommes payées et retenues opérées",
                "مبالغ المبالغ المدفوعة والاقتطاعات المنجزة", bold));
        content.add(vspace(5));

        // ─ Tableau des factures ──────────────────────────────────────────
        // Colonnes : N° Facture | Nature des sommes | Montant brut (DT) | Taux (%) | Retenue (DT)
        float[] cols = {18f, 34f, 16f, 12f, 20f};
        Table t = new Table(UnitValue.createPercentArray(cols)).useAllAvailableWidth();

        // En-tête du tableau
        t.addHeaderCell(thCell("N° Facture\nرقم الفاتورة", bold));
        t.addHeaderCell(thCell("Nature des sommes payées\nطبيعة المبالغ المدفوعة", bold));
        t.addHeaderCell(thCell("Montant brut (DT)\nالمبلغ الإجمالي", bold));
        t.addHeaderCell(thCell("Taux (%)\nالنسبة", bold));
        t.addHeaderCell(thCell("Retenue opérée (DT)\nمبلغ الاقتطاع", bold));

        // Lignes de données
        boolean alt = false;
        for (RetenueSourceLigne ligne : rs.getLignes()) {
            DeviceRgb bg = alt ? CLR_GREY_LIGHT : CLR_BOX_FILL;
            t.addCell(tdCell(nvl(ligne.getNumeroFacture(), ""), regular, bg, TextAlignment.LEFT));
            t.addCell(tdCell("Volaille / منتجات الدواجن", regular, bg, TextAlignment.LEFT));
            t.addCell(tdCell(fmt3(ligne.getMontantBrut()), regular, bg, TextAlignment.RIGHT));
            t.addCell(tdCell(fmtTaux(ligne.getTauxRetenue()), regular, bg, TextAlignment.CENTER));
            t.addCell(tdCell(fmt3(ligne.getMontantRetenue()), regular, bg, TextAlignment.RIGHT));
            alt = !alt;
        }

        // Ligne TOTAL
        t.addCell(totalCell("TOTAL", 2, bold));
        t.addCell(totalCellNum(fmt3(rs.getTotalMontantBrut()), bold));
        t.addCell(totalCell("—", 1, bold));
        t.addCell(totalCellNum(fmt3(rs.getTotalRetenue()), bold));

        content.add(t);

        // ─ Récapitulatif montants ────────────────────────────────────────
        content.add(vspace(6));

        Table recap = new Table(UnitValue.createPercentArray(new float[]{10, 36, 18, 36}))
                .useAllAvailableWidth()
                .setBorder(Border.NO_BORDER);

        recap.addCell(new Cell(1, 2).setBorder(Border.NO_BORDER).setPaddingBottom(3)
                .add(p("Arrêté le présent certificat à la somme de retenue de :",
                        bold, 8f)));
        recap.addCell(new Cell(1, 2).setBorder(Border.NO_BORDER).setPaddingBottom(3)
                .setTextAlignment(TextAlignment.RIGHT)
                .add(p("المبلغ الإجمالي للاقتطاع :", bold, 8f)
                        .setTextAlignment(TextAlignment.RIGHT)));

        // Montant en chiffres
        Cell montantCell = new Cell(1, 4)
                .setBorder(BORDER_MEDIUM)
                .setBackgroundColor(CLR_SECTION_BG)
                .setPadding(5)
                .add(p(fmt3(rs.getTotalRetenue()) + " DT", bold, 11f)
                        .setTextAlignment(TextAlignment.CENTER));
        recap.addCell(montantCell);

        content.add(recap);

        section.addCell(content);
        doc.add(section);
    }

    // ══════════════════════════════════════════════════════════════════════
    // SECTION C — Identité du bénéficiaire (fournisseur)
    // ══════════════════════════════════════════════════════════════════════

    private void buildSectionC(Document doc, Fournisseur f,
                               PdfFont bold, PdfFont regular) {

        Table section = sectionBox();
        Cell content  = sectionContent();

        content.add(sectionTitre("C", "Identité du bénéficiaire", "هوية المستفيد", bold));
        content.add(vspace(5));

        // Matricule fiscal bénéficiaire
        content.add(matriculeFiscalLabel(bold, regular));
        content.add(vspace(2));
        content.add(buildMatriculeCases(
                nvl(f.getMatricule(), ""),
                nvl(f.getCodeTVA(), ""),
                "", "",
                bold, regular));
        content.add(vspace(6));

        content.add(fieldLine("Nom et Prénom ou Dénomination :",
                nvl(f.getRaisonSociale(), ""), bold, regular));
        content.add(vspace(4));
        content.add(fieldLine("Adresse :", nvl(f.getAdresse(), ""), bold, regular));

        if (f.getTelephone1() != null && !f.getTelephone1().isBlank()) {
            content.add(vspace(4));
            content.add(fieldLine("Téléphone :", f.getTelephone1(), bold, regular));
        }

        section.addCell(content);
        doc.add(section);
    }

    // ══════════════════════════════════════════════════════════════════════
    // PIED DE PAGE — Date, lieu, signatures
    // ══════════════════════════════════════════════════════════════════════

    private void buildPiedDePage(Document doc, RetenueSource rs,
                                 PdfFont bold, PdfFont regular, PdfFont oblique) {
        String lieu = nvl(rs.getLieuRetenue(), "_____________");
        String date = rs.getDateRetenue() != null ? rs.getDateRetenue().format(DATE_FR) : "__ / __ / ____";

        // Ligne date et lieu
        doc.add(p("Fait à " + lieu + ", le " + date, regular, 9f));
        doc.add(vspace(4));
        doc.add(p("تحرر ب" + lieu + "، في " + date, regular, 8.5f)
                .setTextAlignment(TextAlignment.RIGHT));

        doc.add(vspace(8));

        // Zones de signature
        Table sigTable = new Table(UnitValue.createPercentArray(new float[]{48, 4, 48}))
                .useAllAvailableWidth()
                .setBorder(Border.NO_BORDER);

        Cell sigPreleveur = new Cell()
                .setBorder(BORDER_MEDIUM)
                .setMinHeight(65)
                .setPadding(6)
                .add(p("Signature et cachet du préleveur", bold, 8.5f)
                        .setTextAlignment(TextAlignment.CENTER))
                .add(p("إمضاء وختم المقتطع", regular, 8f)
                        .setTextAlignment(TextAlignment.CENTER));

        Cell gap = new Cell().setBorder(Border.NO_BORDER);

        Cell sigBenef = new Cell()
                .setBorder(BORDER_MEDIUM)
                .setMinHeight(65)
                .setPadding(6)
                .add(p("Signature du bénéficiaire", bold, 8.5f)
                        .setTextAlignment(TextAlignment.CENTER))
                .add(p("إمضاء المستفيد", regular, 8f)
                        .setTextAlignment(TextAlignment.CENTER));

        sigTable.addCell(sigPreleveur);
        sigTable.addCell(gap);
        sigTable.addCell(sigBenef);
        doc.add(sigTable);

        doc.add(vspace(8));

        // Trait de pied + note légale
        doc.add(hRule());
        doc.add(vspace(3));
        doc.add(p("Ce certificat est établi conformément aux dispositions de l'article 52 du Code de l'Impôt sur le Revenu des Personnes Physiques "
                + "et de l'Impôt sur les Sociétés.",
                oblique, 6.5f)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(0x55, 0x55, 0x55)));
        doc.add(p("Document généré par le système Dind'Or — " + java.time.LocalDate.now().format(DATE_FR),
                oblique, 6.5f)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(0x88, 0x88, 0x88)));
    }

    // ══════════════════════════════════════════════════════════════════════
    // MATRICULE FISCAL — Cases individuelles (format DGI officiel)
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Rend la grille des cases du matricule fiscal tunisien.
     *
     * Format DGI : [N][N][N][N][N][N][N] / [L] / [L] / [E][E][E]
     *  - 7 chiffres identifiant fiscal
     *  - 1 lettre code TVA  (A=assujetti, B=non-assujetti, D=exonéré, E=non-redevable)
     *  - 1 lettre catégorie (M=personne morale, P=personne physique, N=non-résident, etc.)
     *  - 3 chiffres numéro d'établissement secondaire
     */
    private Table buildMatriculeCases(String matricule, String codeTva,
                                      String codeCat, String numEtab,
                                      PdfFont bold, PdfFont regular) {

        String safe = matricule == null ? "" : matricule.replaceAll("[^A-Za-z0-9]", "").toUpperCase();

        // Décomposition robuste
        String id7     = padRight(safe.length() >= 7 ? safe.substring(0, 7) : safe, 7);
        String letTva  = codeTva != null && !codeTva.isBlank() ? codeTva.substring(0, 1).toUpperCase()
                       : (safe.length() >= 8 ? String.valueOf(safe.charAt(7)) : " ");
        String letCat  = codeCat != null && !codeCat.isBlank() ? codeCat.substring(0, 1).toUpperCase()
                       : (safe.length() >= 9 ? String.valueOf(safe.charAt(8)) : " ");
        String etab    = padRight(numEtab != null ? numEtab.replaceAll("[^0-9]", "") : "", 3);

        // Colonnes :  7 cases  +  sep  +  1 case  +  sep  +  1 case  +  sep  +  3 cases
        float[] cw = {7,7,7,7,7,7,7,  2.5f,  7,  2.5f,  7,  2.5f,  7,7,7};
        Table grid = new Table(UnitValue.createPercentArray(cw))
                .useAllAvailableWidth();

        // Ligne 1 : légendes
        for (int k = 1; k <= 7; k++) grid.addCell(caseLabel(String.valueOf(k), regular));
        grid.addCell(caseEmpty());
        grid.addCell(caseLabel("T.V.A", regular));
        grid.addCell(caseEmpty());
        grid.addCell(caseLabel("Cat.", regular));
        grid.addCell(caseEmpty());
        grid.addCell(caseLabel("E1", regular));
        grid.addCell(caseLabel("E2", regular));
        grid.addCell(caseLabel("E3", regular));

        // Ligne 2 : valeurs
        for (char c : id7.toCharArray()) grid.addCell(caseValue(String.valueOf(c), bold));
        grid.addCell(caseSep("/"));
        grid.addCell(caseValue(letTva, bold));
        grid.addCell(caseSep("/"));
        grid.addCell(caseValue(letCat, bold));
        grid.addCell(caseSep("/"));
        for (char c : etab.toCharArray()) grid.addCell(caseValue(String.valueOf(c), bold));

        return grid;
    }

    // ══════════════════════════════════════════════════════════════════════
    // HELPERS — Éléments réutilisables
    // ══════════════════════════════════════════════════════════════════════

    /** Conteneur de section (1 colonne, bordure épaisse extérieure). */
    private Table sectionBox() {
        return new Table(UnitValue.createPercentArray(new float[]{1}))
                .useAllAvailableWidth()
                .setBorder(BORDER_MEDIUM);
    }

    /** Cellule de contenu d'une section. */
    private Cell sectionContent() {
        return new Cell()
                .setBorder(Border.NO_BORDER)
                .setPaddingTop(5).setPaddingBottom(8)
                .setPaddingLeft(8).setPaddingRight(8);
    }

    /** Titre « A — Intitulé français / intitulé arabe ». */
    private Paragraph sectionTitre(String lettre, String fr, String ar, PdfFont bold) {
        return new Paragraph()
                .add(new Text(lettre + " — ").setFont(bold).setFontSize(9.5f))
                .add(new Text(fr + "  /  ").setFont(bold).setFontSize(9f))
                .add(new Text(ar).setFont(bold).setFontSize(9f))
                .setBackgroundColor(CLR_SECTION_BG)
                .setPaddingTop(3).setPaddingBottom(3)
                .setPaddingLeft(4)
                .setMarginBottom(2);
    }

    /** Label « Matricule Fiscal : المعرف الجبائي ». */
    private Paragraph matriculeFiscalLabel(PdfFont bold, PdfFont regular) {
        return new Paragraph()
                .add(new Text("Matricule Fiscal : ").setFont(bold).setFontSize(8f))
                .add(new Text("  /  المعرف الجبائي :").setFont(regular).setFontSize(8f));
    }

    /** Ligne champ : label + valeur soulignée. */
    private Table fieldLine(String label, String value, PdfFont bold, PdfFont regular) {
        Table t = new Table(UnitValue.createPercentArray(new float[]{35, 65}))
                .useAllAvailableWidth()
                .setBorder(Border.NO_BORDER);
        t.addCell(new Cell().setBorder(Border.NO_BORDER).setPaddingRight(4)
                .add(p(label, bold, 8.5f)));
        t.addCell(new Cell()
                .setBorderBottom(new SolidBorder(CLR_BLACK, 0.4f))
                .setBorderTop(Border.NO_BORDER)
                .setBorderLeft(Border.NO_BORDER)
                .setBorderRight(Border.NO_BORDER)
                .add(p(value, regular, 8.5f)));
        return t;
    }

    // ─ Cellules matricule ──────────────────────────────────────────────

    private Cell caseLabel(String text, PdfFont regular) {
        return new Cell()
                .setBorder(Border.NO_BORDER)
                .setPaddingBottom(0)
                .add(new Paragraph(text).setFont(regular).setFontSize(5.5f)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontColor(new DeviceRgb(0x77, 0x77, 0x77)));
    }

    private Cell caseEmpty() {
        return new Cell().setBorder(Border.NO_BORDER)
                .add(new Paragraph(" ").setFontSize(5.5f));
    }

    private Cell caseValue(String ch, PdfFont bold) {
        String v = (ch == null || ch.isBlank()) ? " " : ch.toUpperCase();
        return new Cell()
                .setBorder(BORDER_THIN)
                .setBackgroundColor(CLR_BOX_FILL)
                .setMinHeight(17)
                .setVerticalAlignment(VerticalAlignment.MIDDLE)
                .setPadding(1)
                .add(new Paragraph(v).setFont(bold).setFontSize(9.5f)
                        .setTextAlignment(TextAlignment.CENTER));
    }

    private Cell caseSep(String ch) {
        return new Cell()
                .setBorder(Border.NO_BORDER)
                .setVerticalAlignment(VerticalAlignment.BOTTOM)
                .add(new Paragraph(ch).setFontSize(10f)
                        .setTextAlignment(TextAlignment.CENTER));
    }

    // ─ Cellules tableau B ──────────────────────────────────────────────

    private Cell thCell(String text, PdfFont bold) {
        return new Cell()
                .setBackgroundColor(CLR_HEADER_BG)
                .setBorder(BORDER_THIN)
                .setPadding(4)
                .add(new Paragraph(text).setFont(bold).setFontSize(7.5f)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setMultipliedLeading(1.2f));
    }

    private Cell tdCell(String text, PdfFont regular, DeviceRgb bg, TextAlignment align) {
        return new Cell()
                .setBackgroundColor(bg)
                .setBorder(BORDER_THIN)
                .setPadding(3.5f)
                .add(new Paragraph(text).setFont(regular).setFontSize(8.5f)
                        .setTextAlignment(align)
                        .setMultipliedLeading(1.15f));
    }

    private Cell totalCell(String text, int colspan, PdfFont bold) {
        return new Cell(1, colspan)
                .setBackgroundColor(CLR_TOTAL_BG)
                .setBorder(BORDER_MEDIUM)
                .setPadding(4)
                .add(new Paragraph(text).setFont(bold).setFontSize(8.5f)
                        .setTextAlignment(TextAlignment.CENTER));
    }

    private Cell totalCellNum(String text, PdfFont bold) {
        return new Cell()
                .setBackgroundColor(CLR_TOTAL_BG)
                .setBorder(BORDER_MEDIUM)
                .setPadding(4)
                .add(new Paragraph(text).setFont(bold).setFontSize(8.5f)
                        .setTextAlignment(TextAlignment.RIGHT));
    }

    // ─ Trait horizontal ───────────────────────────────────────────────

    private Table hRule() {
        Table t = new Table(UnitValue.createPercentArray(new float[]{1}))
                .useAllAvailableWidth()
                .setBorderTop(BORDER_THIN)
                .setBorderBottom(Border.NO_BORDER)
                .setBorderLeft(Border.NO_BORDER)
                .setBorderRight(Border.NO_BORDER);
        t.addCell(new Cell().setBorder(Border.NO_BORDER).setHeight(0));
        return t;
    }

    // ─ Helpers génériques ─────────────────────────────────────────────

    private Paragraph p(String text, PdfFont font, float size) {
        return new Paragraph(text == null ? "" : text)
                .setFont(font).setFontSize(size)
                .setMultipliedLeading(1.2f);
    }

    private Div vspace(float h) {
        return new Div().setHeight(h);
    }

    private String fmt3(BigDecimal v) {
        if (v == null) return "0.000";
        return String.format("%,.3f", v);
    }

    private String fmtTaux(BigDecimal v) {
        if (v == null) return "0.000";
        return String.format("%.3f%%", v);
    }

    private String padRight(String s, int len) {
        if (s == null) s = "";
        if (s.length() >= len) return s.substring(0, len);
        return s + " ".repeat(len - s.length());
    }

    private String nvl(String s, String def) {
        return (s == null || s.isBlank()) ? def : s;
    }
}
