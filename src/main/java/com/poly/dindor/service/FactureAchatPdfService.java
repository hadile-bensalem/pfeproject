package com.poly.dindor.service;

import com.itextpdf.io.font.constants.StandardFonts;
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
import com.poly.dindor.config.CompanyProperties;
import com.poly.dindor.entity.FactureAchat;
import com.poly.dindor.entity.FactureAchatLigne;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Génère le PDF "Facture Fournisseur" au format conforme
 * au modèle tunisien standard (REF / DESIGNATION / Qte / P.U.HT /
 * Remise% / Total H.TVA / T.V.A% + tableau RUBRIQUE / TOTAUX).
 */
@Service
@RequiredArgsConstructor
public class FactureAchatPdfService {

    // ── Couleurs ──────────────────────────────────────────────────────────
    private static final DeviceRgb CLR_BLACK      = new DeviceRgb(0x00, 0x00, 0x00);
    private static final DeviceRgb CLR_HEADER_BG  = new DeviceRgb(0xDD, 0xDD, 0xDD);
    private static final DeviceRgb CLR_TOTAL_BG   = new DeviceRgb(0xCC, 0xCC, 0xCC);
    private static final DeviceRgb CLR_WHITE       = new DeviceRgb(0xFF, 0xFF, 0xFF);
    private static final DeviceRgb CLR_ROW_ALT     = new DeviceRgb(0xF5, 0xF5, 0xF5);

    private static final SolidBorder BORDER_THIN   = new SolidBorder(CLR_BLACK, 0.5f);
    private static final SolidBorder BORDER_MEDIUM = new SolidBorder(CLR_BLACK, 1.0f);

    private static final DateTimeFormatter DATE_FR =
            DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.FRENCH);

    private final CompanyProperties    company;
    private final FactureAchatService  factureAchatService;

    // ══════════════════════════════════════════════════════════════════════
    // POINT D'ENTRÉE
    // ══════════════════════════════════════════════════════════════════════

    public byte[] generateFacture(Long factureId) {
        FactureAchat facture = factureAchatService.findEntityById(factureId);
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter   writer = new PdfWriter(baos);
            PdfDocument pdf    = new PdfDocument(writer);
            Document    doc    = new Document(pdf, PageSize.A4);
            doc.setMargins(25, 25, 25, 25);

            PdfFont bold    = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont oblique = PdfFontFactory.createFont(StandardFonts.HELVETICA_OBLIQUE);

            buildHeader(doc, facture, bold, regular);
            doc.add(vspace(6));
            buildArticleTable(doc, facture, bold, regular);
            doc.add(vspace(8));
            buildTotauxTable(doc, facture, bold, regular);
            doc.add(vspace(14));
            buildFooter(doc, oblique);

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération PDF facture achat", e);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // EN-TÊTE
    // ══════════════════════════════════════════════════════════════════════

    private void buildHeader(Document doc, FactureAchat facture,
                             PdfFont bold, PdfFont regular) {

        // Ligne supérieure : société émettrice (gauche) + numéro/date (droite)
        Table topRow = new Table(UnitValue.createPercentArray(new float[]{55, 45}))
                .useAllAvailableWidth()
                .setBorder(Border.NO_BORDER);

        // Colonne gauche — Notre société
        Cell leftCell = new Cell().setBorder(Border.NO_BORDER)
                .add(p(company.getDenomination(), bold, 9f))
                .add(p(company.getAdresse() + " — " + company.getVille(), regular, 8f))
                .add(p("MF : " + company.getMatriculeFiscal(), regular, 8f));
        topRow.addCell(leftCell);

        // Colonne droite — Titre + N° + Date
        String num  = nvl(facture.getNumeroFacture(), "—");
        String date = facture.getDateFacture() != null
                ? facture.getDateFacture().format(DATE_FR) : "—";

        Cell rightCell = new Cell().setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT)
                .add(p("FACTURE FOURN. N°  " + num, bold, 12f)
                        .setTextAlignment(TextAlignment.RIGHT))
                .add(p("Date   " + date, regular, 9f)
                        .setTextAlignment(TextAlignment.RIGHT));
        topRow.addCell(rightCell);
        doc.add(topRow);

        doc.add(vspace(4));

        // Trait séparateur
        doc.add(hRule());

        doc.add(vspace(6));

        // Nom du fournisseur en grand
        String fournisseurNom = facture.getFournisseur() != null
                ? facture.getFournisseur().getRaisonSociale().toUpperCase() : "";
        doc.add(p(fournisseurNom, bold, 14f));

        // Matricule fournisseur (si disponible)
        if (facture.getFournisseur() != null
                && facture.getFournisseur().getMatricule() != null
                && !facture.getFournisseur().getMatricule().isBlank()) {
            doc.add(p("MF : " + facture.getFournisseur().getMatricule(), regular, 8.5f));
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // TABLEAU DES ARTICLES
    // ══════════════════════════════════════════════════════════════════════

    private void buildArticleTable(Document doc, FactureAchat facture,
                                   PdfFont bold, PdfFont regular) {

        // Colonnes : REF | DESIGNATION | Qte | P.U.HT | Remise% | Total H.TVA | T.V.A%
        float[] cols = {6f, 34f, 10f, 14f, 12f, 16f, 8f};
        Table t = new Table(UnitValue.createPercentArray(cols)).useAllAvailableWidth();

        // En-tête
        t.addHeaderCell(th("REF",          bold));
        t.addHeaderCell(th("DESIGNATION",  bold));
        t.addHeaderCell(th("Qte",          bold));
        t.addHeaderCell(th("P.U.HT",       bold));
        t.addHeaderCell(th("Remise%",      bold));
        t.addHeaderCell(th("Total H.TVA",  bold));
        t.addHeaderCell(th("T.V.A%",       bold));

        // Lignes
        boolean alt = false;
        for (FactureAchatLigne ligne : facture.getLignes()) {
            DeviceRgb bg = alt ? CLR_ROW_ALT : CLR_WHITE;

            t.addCell(tdC(String.valueOf(ligne.getOrdre()),                  regular, bg));
            t.addCell(tdL(nvl(ligne.getDesignation(), ""),                   regular, bg));
            t.addCell(tdR(fmt3(ligne.getQuantite()),                         regular, bg));
            t.addCell(tdR(fmt3(ligne.getPrixUnitaireHT()),                   regular, bg));
            t.addCell(tdR(fmt2(ligne.getRemise()),                           regular, bg));
            t.addCell(tdR(fmt3(ligne.getTotalHT()),                          regular, bg));
            t.addCell(tdR(fmt2(ligne.getTva()),                              regular, bg));

            alt = !alt;
        }

        doc.add(t);
    }

    // ══════════════════════════════════════════════════════════════════════
    // TABLEAU DES TOTAUX (RUBRIQUE / TOTAUX)
    // ══════════════════════════════════════════════════════════════════════

    private void buildTotauxTable(Document doc, FactureAchat facture,
                                  PdfFont bold, PdfFont regular) {

        // Tableau positionné à droite : 50% vide + 50% récap
        Table wrapper = new Table(UnitValue.createPercentArray(new float[]{48, 52}))
                .useAllAvailableWidth()
                .setBorder(Border.NO_BORDER);

        wrapper.addCell(new Cell().setBorder(Border.NO_BORDER)); // espace gauche

        // Tableau récapitulatif
        Table recap = new Table(UnitValue.createPercentArray(new float[]{60, 40}))
                .useAllAvailableWidth()
                .setBorder(BORDER_MEDIUM);

        // En-tête RUBRIQUE / TOTAUX
        recap.addCell(recapHead("RUBRIQUE", bold));
        recap.addCell(recapHead("TOTAUX",   bold));

        // Lignes de données
        recap.addCell(recapLabel("MONTANT H. TVA",  regular));
        recap.addCell(recapValue(fmt3(facture.getTotalHT()),      regular));

        recap.addCell(recapLabel("MONTANT REMISE",  regular));
        recap.addCell(recapValue(fmt3(facture.getTotalRemise()),   regular));

        recap.addCell(recapLabel("MONTANT FODEC",   regular));
        recap.addCell(recapValue("0.000",                          regular));

        recap.addCell(recapLabel("MONTANT TVA",     regular));
        recap.addCell(recapValue(fmt3(facture.getTotalTVA()),      regular));

        recap.addCell(recapLabel("TIMBRE",           regular));
        recap.addCell(recapValue(fmt3(facture.getTimbreFiscal()),  regular));

        // Ligne NET À PAYER (fond gris, gras)
        recap.addCell(new Cell()
                .setBackgroundColor(CLR_TOTAL_BG)
                .setBorder(BORDER_MEDIUM)
                .setPadding(4)
                .add(p("NET A PAYER", bold, 9f)));
        recap.addCell(new Cell()
                .setBackgroundColor(CLR_TOTAL_BG)
                .setBorder(BORDER_MEDIUM)
                .setPadding(4)
                .add(p(fmt3(facture.getNetAPayer()), bold, 9f)
                        .setTextAlignment(TextAlignment.RIGHT)));

        wrapper.addCell(new Cell().setBorder(Border.NO_BORDER).add(recap));
        doc.add(wrapper);
    }

    // ══════════════════════════════════════════════════════════════════════
    // PIED DE PAGE
    // ══════════════════════════════════════════════════════════════════════

    private void buildFooter(Document doc, PdfFont oblique) {
        doc.add(hRule());
        doc.add(vspace(3));
        doc.add(p("Document généré par le système Dind'Or — " +
                java.time.LocalDate.now().format(DATE_FR),
                oblique, 7f)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(0x88, 0x88, 0x88)));
    }

    // ══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════════════════

    // ─ En-tête colonne tableau articles ──────────────────────────────────
    private Cell th(String text, PdfFont bold) {
        return new Cell()
                .setBackgroundColor(CLR_HEADER_BG)
                .setBorder(BORDER_THIN)
                .setPadding(4)
                .add(new Paragraph(text).setFont(bold).setFontSize(8f)
                        .setTextAlignment(TextAlignment.CENTER));
    }

    // ─ Cellules données articles ──────────────────────────────────────────
    private Cell tdC(String text, PdfFont f, DeviceRgb bg) {
        return td(text, f, bg, TextAlignment.CENTER);
    }
    private Cell tdL(String text, PdfFont f, DeviceRgb bg) {
        return td(text, f, bg, TextAlignment.LEFT);
    }
    private Cell tdR(String text, PdfFont f, DeviceRgb bg) {
        return td(text, f, bg, TextAlignment.RIGHT);
    }
    private Cell td(String text, PdfFont f, DeviceRgb bg, TextAlignment align) {
        return new Cell()
                .setBackgroundColor(bg)
                .setBorder(BORDER_THIN)
                .setPadding(3.5f)
                .add(new Paragraph(text).setFont(f).setFontSize(8.5f)
                        .setTextAlignment(align));
    }

    // ─ Cellules tableau récapitulatif ─────────────────────────────────────
    private Cell recapHead(String text, PdfFont bold) {
        return new Cell()
                .setBackgroundColor(CLR_HEADER_BG)
                .setBorder(BORDER_MEDIUM)
                .setPadding(4)
                .add(new Paragraph(text).setFont(bold).setFontSize(8.5f)
                        .setTextAlignment(TextAlignment.CENTER));
    }

    private Cell recapLabel(String text, PdfFont regular) {
        return new Cell()
                .setBorder(BORDER_THIN)
                .setPadding(3.5f)
                .add(new Paragraph(text).setFont(regular).setFontSize(8.5f));
    }

    private Cell recapValue(String text, PdfFont regular) {
        return new Cell()
                .setBorder(BORDER_THIN)
                .setPadding(3.5f)
                .add(new Paragraph(text).setFont(regular).setFontSize(8.5f)
                        .setTextAlignment(TextAlignment.RIGHT));
    }

    // ─ Trait horizontal ───────────────────────────────────────────────────
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

    // ─ Espace vertical ───────────────────────────────────────────────────
    private Div vspace(float h) { return new Div().setHeight(h); }

    // ─ Paragraphe simple ─────────────────────────────────────────────────
    private Paragraph p(String text, PdfFont font, float size) {
        return new Paragraph(text == null ? "" : text)
                .setFont(font).setFontSize(size).setMultipliedLeading(1.2f);
    }

    // ─ Formatage numérique ───────────────────────────────────────────────
    private String fmt3(BigDecimal v) {
        if (v == null) return "0.000";
        return String.format("%,.3f", v);
    }

    private String fmt2(BigDecimal v) {
        if (v == null) return "0.00";
        return String.format("%.2f", v);
    }

    private String nvl(String s, String def) {
        return (s == null || s.isBlank()) ? def : s;
    }
}
