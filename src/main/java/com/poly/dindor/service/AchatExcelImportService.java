package com.poly.dindor.service;

import com.poly.dindor.dto.request.FactureAchatLigneRequest;
import com.poly.dindor.dto.request.FactureAchatRequest;
import com.poly.dindor.dto.response.AchatExcelImportResponse;
import com.poly.dindor.entity.Fournisseur;
import com.poly.dindor.exception.ResourceNotFoundException;
import com.poly.dindor.repository.FournisseurRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Import des achats depuis un fichier Excel (.xls ou .xlsx).
 * <p>
 * Ligne d'en-tête obligatoire. Colonnes reconnues (libellés approximatifs, insensible à la casse / accents) :
 * <ul>
 *   <li>Date : date, date facture, …</li>
 *   <li>Désignation : designation, libelle, produit, …</li>
 *   <li>Quantité : quantite, qte, …</li>
 *   <li>Prix unitaire HT : prix, pu ht, prix unitaire, …</li>
 *   <li>Fournisseur : id fournisseur, matricule, raison sociale / fournisseur</li>
 *   <li>Optionnel : n° facture (pour regrouper plusieurs lignes), code article, tva, remise</li>
 * </ul>
 * Sans n° de facture, chaque ligne produit une facture distincte (numéro généré automatiquement).
 */
@Service
@RequiredArgsConstructor
public class AchatExcelImportService {

    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
        DateTimeFormatter.ISO_LOCAL_DATE,
        DateTimeFormatter.ofPattern("dd/MM/yyyy"),
        DateTimeFormatter.ofPattern("d/M/yyyy"),
        DateTimeFormatter.ofPattern("dd-MM-yyyy"),
        DateTimeFormatter.ofPattern("yyyy/MM/dd")
    );

    private static final Pattern NON_DIGIT = Pattern.compile("[^0-9,\\-\\.]");

    private final FournisseurRepository fournisseurRepository;
    private final FactureAchatService factureAchatService;

    @Transactional
    public AchatExcelImportResponse importFile(MultipartFile file, boolean applyStockMouvements) {
        if (file == null || file.isEmpty()) {
            return AchatExcelImportResponse.builder()
                .erreurs(List.of("Fichier vide."))
                .build();
        }
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        if (!name.toLowerCase(Locale.ROOT).endsWith(".xls")
            && !name.toLowerCase(Locale.ROOT).endsWith(".xlsx")) {
            return AchatExcelImportResponse.builder()
                .erreurs(List.of("Format attendu : .xls ou .xlsx"))
                .build();
        }
        try (InputStream in = file.getInputStream(); Workbook wb = WorkbookFactory.create(in)) {
            return importWorkbook(wb, applyStockMouvements);
        } catch (Exception e) {
            return AchatExcelImportResponse.builder()
                .erreurs(List.of("Lecture Excel impossible : " + e.getMessage()))
                .build();
        }
    }

    private AchatExcelImportResponse importWorkbook(Workbook wb, boolean applyStockMouvements) {
        Sheet sheet = wb.getSheetAt(0);
        if (sheet.getPhysicalNumberOfRows() < 2) {
            return AchatExcelImportResponse.builder()
                .erreurs(List.of("La feuille doit contenir une ligne d'en-tête et au moins une ligne de données."))
                .build();
        }

        DataFormatter fmt = new DataFormatter(Locale.FRENCH);
        Row headerRow = sheet.getRow(sheet.getFirstRowNum());
        ColumnMap col = mapColumns(headerRow, fmt);
        List<String> missing = col.validate();
        if (!missing.isEmpty()) {
            return AchatExcelImportResponse.builder()
                .erreurs(List.of("Colonnes manquantes ou non reconnues : " + String.join(", ", missing)))
                .build();
        }

        List<ParsedRow> parsed = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        for (int r = headerRow.getRowNum() + 1; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (row == null || rowIsEmpty(row, fmt)) {
                continue;
            }
            try {
                ParsedRow p = parseRow(row, r + 1, col, fmt, warnings);
                if (p != null) {
                    parsed.add(p);
                }
            } catch (Exception ex) {
                warnings.add("Ligne " + (r + 1) + " ignorée : " + ex.getMessage());
            }
        }

        if (parsed.isEmpty()) {
            return AchatExcelImportResponse.builder()
                .avertissements(warnings)
                .erreurs(List.of("Aucune ligne de données valide."))
                .build();
        }

        Map<String, List<ParsedRow>> groups = new LinkedHashMap<>();
        for (ParsedRow p : parsed) {
            groups.computeIfAbsent(p.groupKey(), k -> new ArrayList<>()).add(p);
        }

        int imported = 0;
        int skippedLines = 0;
        for (Map.Entry<String, List<ParsedRow>> e : groups.entrySet()) {
            List<ParsedRow> lignes = e.getValue();
            ParsedRow head = lignes.get(0);
            try {
                FactureAchatRequest req = buildRequest(lignes, head);
                factureAchatService.createImportFacture(req, applyStockMouvements);
                imported++;
            } catch (IllegalStateException dup) {
                if (dup.getMessage() != null && dup.getMessage().contains("déjà présent")) {
                    warnings.add(dup.getMessage() + " (" + lignes.size() + " ligne(s) ignorées)");
                    skippedLines += lignes.size();
                } else {
                    warnings.add("Groupe « " + e.getKey() + " » : " + dup.getMessage());
                    skippedLines += lignes.size();
                }
            } catch (Exception ex) {
                warnings.add("Groupe « " + e.getKey() + " » : " + ex.getMessage());
                skippedLines += lignes.size();
            }
        }

        return AchatExcelImportResponse.builder()
            .facturesImportees(imported)
            .lignesIgnorees(skippedLines)
            .avertissements(warnings)
            .build();
    }

    private FactureAchatRequest buildRequest(List<ParsedRow> lignes, ParsedRow head) {
        FactureAchatRequest req = new FactureAchatRequest();
        req.setDateFacture(head.date());
        req.setFournisseurId(head.fournisseurId());
        if (head.numeroFacture() != null && !head.numeroFacture().isBlank()) {
            req.setNumeroFacture(head.numeroFacture().trim());
        }

        List<FactureAchatLigneRequest> lineReqs = new ArrayList<>();
        int ordre = 1;
        for (ParsedRow p : lignes) {
            FactureAchatLigneRequest lr = new FactureAchatLigneRequest();
            lr.setCodeArticle(p.codeArticle());
            lr.setDesignation(p.designation());
            lr.setQuantite(p.quantite());
            lr.setPrixUnitaireHT(p.prixHt());
            lr.setRemise(p.remise() != null ? p.remise() : BigDecimal.ZERO);
            lr.setTva(p.tva() != null ? p.tva() : BigDecimal.ZERO);
            lr.setOrdre(ordre++);
            lineReqs.add(lr);
        }
        req.setLignes(lineReqs);
        return req;
    }

    private record ParsedRow(
        int excelRow,
        String numeroFacture,
        LocalDate date,
        long fournisseurId,
        String codeArticle,
        String designation,
        BigDecimal quantite,
        BigDecimal prixHt,
        BigDecimal remise,
        BigDecimal tva
    ) {
        String groupKey() {
            if (numeroFacture != null && !numeroFacture.isBlank()) {
                return "N|" + numeroFacture.trim() + "|F|" + fournisseurId;
            }
            return "R|" + excelRow + "|F|" + fournisseurId;
        }
    }

    private ParsedRow parseRow(Row row, int excelRow1Based, ColumnMap col, DataFormatter fmt, List<String> warnings)
        throws ResourceNotFoundException {

        String numero = trimToNull(stringCell(row, col.numero, fmt));
        LocalDate date = parseDate(row.getCell(col.date), fmt);
        if (date == null) {
            throw new IllegalArgumentException("date de facture invalide");
        }

        Long fourId = null;
        if (col.fournisseurId != null) {
            String idStr = stringCell(row, col.fournisseurId, fmt).trim();
            if (!idStr.isEmpty()) {
                try {
                    fourId = Long.parseLong(idStr.replace(",", ".").split("\\.")[0]);
                } catch (NumberFormatException ignored) {
                    /* matricule dans la colonne id ? */
                }
            }
        }
        if (fourId == null && col.matriculeFournisseur != null) {
            String mat = stringCell(row, col.matriculeFournisseur, fmt).trim();
            if (!mat.isEmpty()) {
                fourId = fournisseurRepository.findByMatricule(mat)
                    .map(Fournisseur::getId)
                    .orElse(null);
            }
        }
        if (fourId == null && col.fournisseurNom != null) {
            String nom = stringCell(row, col.fournisseurNom, fmt).trim();
            if (!nom.isEmpty()) {
                List<Fournisseur> matches = fournisseurRepository.findAllByRaisonSocialeIgnoreCase(nom);
                if (matches.size() > 1) {
                    warnings.add("Ligne " + excelRow1Based + " : plusieurs fournisseurs pour « " + nom + " », le premier est utilisé.");
                }
                fourId = fournisseurRepository.findFirstByRaisonSocialeIgnoreCase(nom)
                    .map(Fournisseur::getId)
                    .orElse(null);
            }
        }
        if (fourId == null) {
            throw new IllegalArgumentException("fournisseur introuvable (id, matricule ou raison sociale)");
        }
        final Long finalFourId = fourId;
        fournisseurRepository.findById(finalFourId)
            .orElseThrow(() -> new ResourceNotFoundException("Fournisseur id " + finalFourId));

        String designation = stringCell(row, col.designation, fmt).trim();
        if (designation.isEmpty()) {
            throw new IllegalArgumentException("désignation vide");
        }

        BigDecimal qte = parseDecimal(stringCell(row, col.quantite, fmt));
        if (qte == null || qte.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("quantité invalide");
        }

        BigDecimal pu = parseDecimal(stringCell(row, col.prixHt, fmt));
        if (pu == null || pu.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("prix unitaire HT invalide");
        }

        String code = col.codeArticle != null ? trimToNull(stringCell(row, col.codeArticle, fmt)) : null;
        BigDecimal remise = col.remise != null ? parseDecimal(stringCell(row, col.remise, fmt)) : null;
        BigDecimal tva = col.tva != null ? parseDecimal(stringCell(row, col.tva, fmt)) : null;

        return new ParsedRow(
            excelRow1Based,
            numero,
            date,
            fourId,
            code,
            designation,
            qte,
            pu,
            remise,
            tva
        );
    }

    private static String trimToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    private static boolean rowIsEmpty(Row row, DataFormatter fmt) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && !fmt.formatCellValue(cell).isBlank()) {
                return false;
            }
        }
        return true;
    }

    private static String stringCell(Row row, int colIndex, DataFormatter fmt) {
        if (colIndex < 0) {
            return "";
        }
        Cell cell = row.getCell(colIndex);
        return cell == null ? "" : fmt.formatCellValue(cell).trim();
    }

    private LocalDate parseDate(Cell cell, DataFormatter fmt) {
        if (cell == null) {
            return null;
        }
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            try {
                return cell.getLocalDateTimeCellValue().toLocalDate();
            } catch (Exception e) {
                Date javaDate = cell.getDateCellValue();
                if (javaDate != null) {
                    return new java.sql.Date(javaDate.getTime()).toLocalDate();
                }
            }
        }
        String s = fmt.formatCellValue(cell).trim();
        if (s.isEmpty()) {
            return null;
        }
        for (DateTimeFormatter f : DATE_FORMATS) {
            try {
                return LocalDate.parse(s, f);
            } catch (DateTimeParseException ignored) {
                /* next */
            }
        }
        return null;
    }

    private static BigDecimal parseDecimal(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String s = raw.trim().replace('\u00a0', ' ').replace(" ", "");
        if (s.contains(",") && s.contains(".")) {
            /* ex. 1.234,56 */
            if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
                s = s.replace(".", "").replace(',', '.');
            } else {
                s = s.replace(",", "");
            }
        } else if (s.contains(",")) {
            s = s.replace(',', '.');
        }
        s = NON_DIGIT.matcher(s).replaceAll("");
        if (s.isEmpty() || "-".equals(s) || ".".equals(s)) {
            return null;
        }
        try {
            return new BigDecimal(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String normHeader(String s) {
        if (s == null) {
            return "";
        }
        String n = Normalizer.normalize(s.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
            .replaceAll("\\p{M}+", "");
        return n.replaceAll("\\s+", " ").trim();
    }

    private ColumnMap mapColumns(Row headerRow, DataFormatter fmt) {
        ColumnMap m = new ColumnMap();
        if (headerRow == null) {
            return m;
        }
        for (Cell cell : headerRow) {
            String h = normHeader(fmt.formatCellValue(cell));
            if (h.isEmpty()) {
                continue;
            }
            int idx = cell.getColumnIndex();

            if (h.contains("fournisseur") && (h.contains("id") || h.matches(".*\\bid\\b.*"))) {
                m.fournisseurId = idx;
                continue;
            }
            if ((h.contains("matricule") && h.contains("fourn")) || h.equals("matricule fournisseur")) {
                m.matriculeFournisseur = idx;
                continue;
            }
            if (h.contains("code") && h.contains("fourn")) {
                m.matriculeFournisseur = idx;
                continue;
            }
            if ((h.contains("numero") && h.contains("facture"))
                || h.equals("n facture")
                || h.equals("no facture")
                || (h.startsWith("n°") && h.contains("facture"))
                || h.equals("nf")
                || h.equals("ref facture")) {
                m.numero = idx;
                continue;
            }
            if (h.equals("facture") && m.numero < 0) {
                m.numero = idx;
                continue;
            }
            if (h.contains("date")) {
                m.date = idx;
                continue;
            }
            if (h.contains("code") && (h.contains("article") || h.contains("art"))) {
                m.codeArticle = idx;
                continue;
            }
            if (h.contains("designation") || h.contains("libelle") || h.contains("libellé")
                || h.contains("produit") || h.contains("article") && !h.contains("code")) {
                m.designation = idx;
                continue;
            }
            if (h.contains("quantite") || h.contains("quantité") || h.equals("qte") || h.equals("qty")) {
                m.quantite = idx;
                continue;
            }
            if (h.contains("prix") && (h.contains("ht") || h.contains("unitaire") || h.contains("pu"))
                || h.equals("pu ht") || h.equals("puht")) {
                m.prixHt = idx;
                continue;
            }
            if (h.equals("prix") && m.prixHt < 0) {
                m.prixHt = idx;
                continue;
            }
            if (h.contains("tva") || h.contains("taux tva")) {
                m.tva = idx;
                continue;
            }
            if (h.contains("remise")) {
                m.remise = idx;
                continue;
            }
            if (h.contains("fournisseur") || h.contains("raison") || h.contains("fournis")) {
                m.fournisseurNom = idx;
            }
        }
        return m;
    }

    private static final class ColumnMap {
        int numero = -1;
        int date = -1;
        Integer fournisseurId;
        Integer matriculeFournisseur;
        Integer fournisseurNom;
        int designation = -1;
        int quantite = -1;
        int prixHt = -1;
        Integer codeArticle;
        Integer tva;
        Integer remise;

        List<String> validate() {
            List<String> miss = new ArrayList<>();
            if (date < 0) {
                miss.add("date");
            }
            if (designation < 0) {
                miss.add("désignation");
            }
            if (quantite < 0) {
                miss.add("quantité");
            }
            if (prixHt < 0) {
                miss.add("prix unitaire HT");
            }
            boolean four = fournisseurId != null || matriculeFournisseur != null || fournisseurNom != null;
            if (!four) {
                miss.add("fournisseur (id, matricule ou raison sociale)");
            }
            return miss;
        }
    }
}
