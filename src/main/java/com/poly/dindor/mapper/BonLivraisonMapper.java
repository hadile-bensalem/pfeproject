package com.poly.dindor.mapper;

import com.poly.dindor.dto.request.BonLivraisonLigneRequest;
import com.poly.dindor.dto.request.BonLivraisonRequest;
import com.poly.dindor.dto.request.PaiementVenteRequest;
import com.poly.dindor.dto.response.BonLivraisonLigneResponse;
import com.poly.dindor.dto.response.BonLivraisonResponse;
import com.poly.dindor.entity.BonLivraison;
import com.poly.dindor.entity.BonLivraisonLigne;
import com.poly.dindor.entity.Client;
import com.poly.dindor.entity.PaiementVente;
import com.poly.dindor.util.AmountToWordsUtil;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.stream.Collectors;

public class BonLivraisonMapper {

    private BonLivraisonMapper() {}

    public static BonLivraison toEntity(BonLivraisonRequest req, Client client) {
        BonLivraison bl = BonLivraison.builder()
                .numeroBL(req.getNumeroBL())
                .dateBL(LocalDate.parse(req.getDateBL()))
                .client(client)
                .clientCode(client != null ? client.getCodeClient() :
                            (req.getClientCode() != null ? req.getClientCode() : ""))
                .clientNom(client != null ? client.getNom() :
                           (req.getClientNom() != null ? req.getClientNom() : ""))
                .clientAdresse(client != null ? client.getAdresse() :
                               (req.getClientAdresse() != null ? req.getClientAdresse() : ""))
                .clientMF(client != null ? client.getMatriculeFiscal() :
                          (req.getClientMF() != null ? req.getClientMF() : ""))
                .transporteurNom(req.getTransporteurNom())
                .vehiculeNumero(req.getVehiculeNumero())
                .build();

        for (int i = 0; i < req.getLignes().size(); i++) {
            BonLivraisonLigneRequest lr = req.getLignes().get(i);
            BonLivraisonLigne ligne = BonLivraisonLigne.builder()
                    .bonLivraison(bl)
                    .codeArticle(lr.getCodeArticle())
                    .designation(lr.getDesignation())
                    .unite(lr.getUnite())
                    .quantite(lr.getQuantite())
                    .prixUnitaireHT(lr.getPrixUnitaireHT())
                    .remise(lr.getRemise()  != null ? lr.getRemise()  : BigDecimal.ZERO)
                    .tva(lr.getTva()        != null ? lr.getTva()      : BigDecimal.ZERO)
                    .ordre(i + 1)
                    .build();
            bl.getLignes().add(ligne);
        }

        bl.recalculerTotaux();

        PaiementVenteRequest pr  = req.getPaiement();
        PaiementVente.ModePaiement mode =
                PaiementVente.ModePaiement.valueOf(pr.getModePaiement().toUpperCase());

        PaiementVente paiement = PaiementVente.builder()
                .bonLivraison(bl)
                .modePaiement(mode)
                .montantPaye(pr.getMontantPaye()   != null ? pr.getMontantPaye()   : BigDecimal.ZERO)
                .montantReste(pr.getMontantReste() != null ? pr.getMontantReste()  : BigDecimal.ZERO)
                .dateLimiteCredit(pr.getDateLimiteCredit() != null && !pr.getDateLimiteCredit().isBlank()
                        ? LocalDate.parse(pr.getDateLimiteCredit()) : null)
                .build();
        bl.setPaiement(paiement);

        bl.setEtatPaiement(mode == PaiementVente.ModePaiement.ESPECES
                ? BonLivraison.EtatPaiement.PAYE
                : BonLivraison.EtatPaiement.EN_ATTENTE);

        return bl;
    }

    public static BonLivraisonResponse toResponse(BonLivraison bl) {
        BonLivraisonResponse r = new BonLivraisonResponse();
        r.setId(bl.getId());
        r.setNumeroBL(bl.getNumeroBL());
        r.setDateBL(bl.getDateBL().toString());
        r.setClientId(bl.getClient() != null ? bl.getClient().getId() : null);
        r.setClientCode(bl.getClientCode());
        r.setClientNom(bl.getClientNom());
        r.setClientAdresse(bl.getClientAdresse());
        r.setClientMF(bl.getClientMF());
        r.setTransporteurId(bl.getTransporteur() != null ? bl.getTransporteur().getId() : null);
        r.setVehiculeId(bl.getVehicule() != null ? bl.getVehicule().getId() : null);
        r.setTransporteurNom(bl.getTransporteurNom());
        r.setVehiculeNumero(bl.getVehiculeNumero());
        r.setSoldeSurBL(bl.getSoldeSurBL());
        r.setTotalBrut(bl.getTotalBrut());
        r.setTotalRemise(bl.getTotalRemise());
        r.setTotalHT(bl.getTotalHT());
        r.setTotalTVA(bl.getTotalTVA());
        r.setTimbreFiscal(bl.getTimbreFiscal());
        r.setNetAPayer(bl.getNetAPayer());
        r.setMontantEnLettres(AmountToWordsUtil.convert(bl.getNetAPayer()));
        r.setEtatPaiement(bl.getEtatPaiement().name());

        if (bl.getPaiement() != null) {
            r.setModePaiement(bl.getPaiement().getModePaiement().name());
            r.setMontantPaye(bl.getPaiement().getMontantPaye());
            r.setMontantReste(bl.getPaiement().getMontantReste());
            r.setDateLimiteCredit(bl.getPaiement().getDateLimiteCredit() != null
                    ? bl.getPaiement().getDateLimiteCredit().toString() : null);
        }

        if (bl.getLignes() != null) {
            r.setLignes(bl.getLignes().stream()
                    .map(BonLivraisonMapper::toLigneResponse)
                    .collect(Collectors.toList()));

            BigDecimal benefice = bl.getLignes().stream()
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

    private static BonLivraisonLigneResponse toLigneResponse(BonLivraisonLigne l) {
        BonLivraisonLigneResponse r = new BonLivraisonLigneResponse();
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
