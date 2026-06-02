package com.poly.dindor.mapper;

import com.poly.dindor.dto.request.ArticleRequest;
import com.poly.dindor.dto.response.ArticleResponse;
import com.poly.dindor.entity.Article;

import java.math.BigDecimal;

public final class ArticleMapper {

    private ArticleMapper() {
    }

    public static Article toEntity(ArticleRequest request) {
        if (request == null) {
            return null;
        }
        return Article.builder()
                .codeArticle(request.getCodeArticle())
                .designation(request.getDesignation())
                .unite(request.getUnite())
                .famille(request.getFamille())
                .origine(request.getOrigine())
                .codeArticleSource(request.getCodeArticleSource())
                .produitSpecial(produitSpecialEffectif(request))
                .tauxConversion(nullSafeBigDecimal(request.getTauxConversion(),
                        request.getCodeArticleSource() != null ? BigDecimal.ZERO : BigDecimal.ONE))
                .prixAchatHT(nullSafeBigDecimal(request.getPrixAchatHT(), BigDecimal.ZERO))
                .prixVente(nullSafeBigDecimal(request.getPrixVente(), BigDecimal.ZERO))
                .prixPublic(nullSafeBigDecimal(request.getPrixPublic(), BigDecimal.ZERO))
                .tva(nullSafeBigDecimal(request.getTva(), BigDecimal.ZERO))
                .stock1(nullSafeBigDecimal(request.getStock1(), BigDecimal.ZERO))
                .stock2(nullSafeBigDecimal(request.getStock2(), BigDecimal.ZERO))
                .pump(nullSafeBigDecimal(request.getPump(), BigDecimal.ZERO))
                .qteNbre(Boolean.TRUE.equals(request.getQteNbre()))
                .autreIndir(Boolean.TRUE.equals(request.getAutreIndir()))
                .stockezBlock(Boolean.TRUE.equals(request.getStockezBlock()))
                .build();
    }

    public static void updateEntity(Article entity, ArticleRequest request) {
        if (entity == null || request == null) {
            return;
        }
        entity.setCodeArticle(request.getCodeArticle());
        entity.setDesignation(request.getDesignation());
        entity.setUnite(request.getUnite());
        entity.setFamille(request.getFamille());
        entity.setOrigine(request.getOrigine());
        entity.setCodeArticleSource(request.getCodeArticleSource());
        entity.setProduitSpecial(produitSpecialEffectif(request));
        // Si on passe d'un article standard à dérivé et qu'aucun taux n'est fourni, remettre à 0
        BigDecimal tauxDefault = (request.getCodeArticleSource() != null
                && entity.getTauxConversion().compareTo(BigDecimal.ONE) == 0)
                ? BigDecimal.ZERO : BigDecimal.ONE;
        entity.setTauxConversion(nullSafeBigDecimal(request.getTauxConversion(), tauxDefault));
        entity.setPrixAchatHT(nullSafeBigDecimal(request.getPrixAchatHT(), BigDecimal.ZERO));
        entity.setPrixVente(nullSafeBigDecimal(request.getPrixVente(), BigDecimal.ZERO));
        entity.setPrixPublic(nullSafeBigDecimal(request.getPrixPublic(), BigDecimal.ZERO));
        entity.setTva(nullSafeBigDecimal(request.getTva(), BigDecimal.ZERO));
        entity.setStock1(nullSafeBigDecimal(request.getStock1(), BigDecimal.ZERO));
        entity.setStock2(nullSafeBigDecimal(request.getStock2(), BigDecimal.ZERO));
        entity.setPump(nullSafeBigDecimal(request.getPump(), BigDecimal.ZERO));
        entity.setQteNbre(Boolean.TRUE.equals(request.getQteNbre()));
        entity.setAutreIndir(Boolean.TRUE.equals(request.getAutreIndir()));
        entity.setStockezBlock(Boolean.TRUE.equals(request.getStockezBlock()));
    }

    public static ArticleResponse toResponse(Article entity) {
        if (entity == null) {
            return null;
        }
        return ArticleResponse.builder()
                .id(entity.getId())
                .codeArticle(entity.getCodeArticle())
                .designation(entity.getDesignation())
                .unite(entity.getUnite())
                .famille(entity.getFamille())
                .origine(entity.getOrigine())
                .codeArticleSource(entity.getCodeArticleSource())
                .produitSpecial(entity.getProduitSpecial())
                .tauxConversion(entity.getTauxConversion())
                .prixAchatHT(entity.getPrixAchatHT())
                .prixVente(entity.getPrixVente())
                .prixPublic(entity.getPrixPublic())
                .tva(entity.getTva())
                .stock1(entity.getStock1())
                .stock2(entity.getStock2())
                .pump(entity.getPump())
                .qteNbre(entity.getQteNbre())
                .autreIndir(entity.getAutreIndir())
                .stockezBlock(entity.getStockezBlock())
                .imageUrl(entity.getImageUrl())
                .dateCreation(entity.getDateCreation())
                .dateModification(entity.getDateModification())
                .build();
    }

    private static BigDecimal nullSafeBigDecimal(BigDecimal value, BigDecimal defaultVal) {
        return value != null ? value : defaultVal;
    }

    /** Produit dérivé : jamais « spécial ». */
    private static boolean produitSpecialEffectif(ArticleRequest request) {
        if (request.getCodeArticleSource() != null && !request.getCodeArticleSource().isBlank()) {
            return false;
        }
        return Boolean.TRUE.equals(request.getProduitSpecial());
    }
}
