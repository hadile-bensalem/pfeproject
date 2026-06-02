package com.poly.dindor.mapper;

import com.poly.dindor.dto.request.FactureClientLigneRequest;
import com.poly.dindor.dto.request.FactureClientRequest;
import com.poly.dindor.dto.request.PaiementFactureClientRequest;
import com.poly.dindor.dto.response.FactureClientLigneResponse;
import com.poly.dindor.dto.response.FactureClientResponse;
import com.poly.dindor.entity.Client;
import com.poly.dindor.entity.FactureClient;
import com.poly.dindor.entity.FactureClientLigne;
import com.poly.dindor.entity.PaiementFactureClient;
import com.poly.dindor.util.AmountToWordsUtil;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.stream.Collectors;

public class FactureClientMapper {

    private FactureClientMapper() {}

    public static FactureClient toEntity(FactureClientRequest req, Client client) {
        FactureClient.TypeDocument typeDoc = "BON_LIVRAISON".equalsIgnoreCase(req.getTypeDocument())
                ? FactureClient.TypeDocument.BON_LIVRAISON
                : FactureClient.TypeDocument.FACTURE;

        FactureClient fc = FactureClient.builder()
                .numeroFacture(req.getNumeroFacture())
                .typeDocument(typeDoc)
                .dateFacture(LocalDate.parse(req.getDateFacture()))
                .client(client)
                .clientCode(client != null ? client.getCodeClient() :
                            (req.getClientCode() != null ? req.getClientCode() : ""))
                .clientNom(client != null ? client.getNom() :
                           (req.getClientNom() != null ? req.getClientNom() : ""))
                .clientAdresse(client != null ? client.getAdresse() :
                               (req.getClientAdresse() != null ? req.getClientAdresse() : ""))
                .clientMF(client != null ? client.getMatriculeFiscal() :
                          (req.getClientMF() != null ? req.getClientMF() : ""))
                .build();

        for (int i = 0; i < req.getLignes().size(); i++) {
            FactureClientLigneRequest lr = req.getLignes().get(i);
            FactureClientLigne ligne = FactureClientLigne.builder()
                    .factureClient(fc)
                    .codeArticle(lr.getCodeArticle())
                    .designation(lr.getDesignation())
                    .unite(lr.getUnite())
                    .quantite(lr.getQuantite())
                    .prixUnitaireHT(lr.getPrixUnitaireHT())
                    .remise(lr.getRemise()  != null ? lr.getRemise()  : BigDecimal.ZERO)
                    .tva(lr.getTva()        != null ? lr.getTva()      : BigDecimal.ZERO)
                    .ordre(i + 1)
                    .build();
            fc.getLignes().add(ligne);
        }

        fc.recalculerTotaux();

        PaiementFactureClientRequest pr = req.getPaiement();
        PaiementFactureClient.ModePaiement mode =
                PaiementFactureClient.ModePaiement.valueOf(pr.getModePaiement().toUpperCase());

        PaiementFactureClient paiement = PaiementFactureClient.builder()
                .factureClient(fc)
                .modePaiement(mode)
                .montantPaye(pr.getMontantPaye()   != null ? pr.getMontantPaye()   : BigDecimal.ZERO)
                .montantReste(pr.getMontantReste() != null ? pr.getMontantReste()  : BigDecimal.ZERO)
                .dateLimiteCredit(pr.getDateLimiteCredit() != null && !pr.getDateLimiteCredit().isBlank()
                        ? LocalDate.parse(pr.getDateLimiteCredit()) : null)
                .build();
        fc.setPaiement(paiement);

        fc.setEtatPaiement(mode == PaiementFactureClient.ModePaiement.ESPECES
                ? FactureClient.EtatPaiement.PAYE
                : FactureClient.EtatPaiement.EN_ATTENTE);

        return fc;
    }

    public static FactureClientResponse toResponse(FactureClient fc) {
        FactureClientResponse r = new FactureClientResponse();
        r.setId(fc.getId());
        r.setNumeroFacture(fc.getNumeroFacture());
        r.setTypeDocument(fc.getTypeDocument() != null ? fc.getTypeDocument().name() : "FACTURE");
        r.setDateFacture(fc.getDateFacture().toString());
        r.setClientId(fc.getClient() != null ? fc.getClient().getId() : null);
        r.setClientCode(fc.getClientCode());
        r.setClientNom(fc.getClientNom());
        r.setClientAdresse(fc.getClientAdresse());
        r.setClientMF(fc.getClientMF());
        r.setSoldeSurFacture(fc.getSoldeSurFacture());
        r.setTotalBrut(fc.getTotalBrut());
        r.setTotalRemise(fc.getTotalRemise());
        r.setTotalHT(fc.getTotalHT());
        r.setTotalTVA(fc.getTotalTVA());
        r.setTimbreFiscal(fc.getTimbreFiscal());
        r.setNetAPayer(fc.getNetAPayer());
        r.setMontantEnLettres(AmountToWordsUtil.convert(fc.getNetAPayer()));
        r.setEtatPaiement(fc.getEtatPaiement().name());

        if (fc.getPaiement() != null) {
            r.setModePaiement(fc.getPaiement().getModePaiement().name());
            r.setMontantPaye(fc.getPaiement().getMontantPaye());
            r.setMontantReste(fc.getPaiement().getMontantReste());
            r.setDateLimiteCredit(fc.getPaiement().getDateLimiteCredit() != null
                    ? fc.getPaiement().getDateLimiteCredit().toString() : null);
        }

        if (fc.getLignes() != null) {
            r.setLignes(fc.getLignes().stream()
                    .map(FactureClientMapper::toLigneResponse)
                    .collect(Collectors.toList()));

            BigDecimal benefice = fc.getLignes().stream()
                    .map(l -> {
                        BigDecimal rev = l.getPrixRevient();
                        if (rev == null || rev.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
                        return l.getTotalHT().subtract(rev.multiply(l.getQuantite()));
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(3, RoundingMode.HALF_UP);
            r.setBenefice(benefice);
        }
        return r;
    }

    private static FactureClientLigneResponse toLigneResponse(FactureClientLigne l) {
        FactureClientLigneResponse r = new FactureClientLigneResponse();
        r.setId(l.getId());
        r.setCodeArticle(l.getCodeArticle());
        r.setDesignation(l.getDesignation());
        r.setUnite(l.getUnite());
        r.setQuantite(l.getQuantite());
        r.setPrixUnitaireHT(l.getPrixUnitaireHT());
        r.setRemise(l.getRemise());
        r.setTva(l.getTva());
        r.setTotalHT(l.getTotalHT());
        r.setMontantTVA(l.getMontantTVA());
        r.setMontantRemise(l.getMontantRemise());
        r.setPrixRevient(l.getPrixRevient());
        r.setOrdre(l.getOrdre());
        return r;
    }
}
