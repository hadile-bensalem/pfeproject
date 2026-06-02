package com.poly.dindor.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class AmountToWordsUtil {

    private AmountToWordsUtil() {}

    private static final String[] ONES = {
        "", "UN", "DEUX", "TROIS", "QUATRE", "CINQ", "SIX", "SEPT", "HUIT", "NEUF",
        "DIX", "ONZE", "DOUZE", "TREIZE", "QUATORZE", "QUINZE", "SEIZE",
        "DIX-SEPT", "DIX-HUIT", "DIX-NEUF"
    };

    private static final String[] TENS = {
        "", "DIX", "VINGT", "TRENTE", "QUARANTE", "CINQUANTE",
        "SOIXANTE", "SOIXANTE", "QUATRE-VINGT", "QUATRE-VINGT"
    };

    public static String convert(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) < 0) return "";
        if (amount.compareTo(BigDecimal.ZERO) == 0) return "ZÉRO DINAR";

        long dinars  = amount.longValue();
        long millimes = amount.subtract(BigDecimal.valueOf(dinars))
                              .multiply(BigDecimal.valueOf(1000))
                              .setScale(0, RoundingMode.HALF_UP)
                              .longValue();

        StringBuilder sb = new StringBuilder();
        sb.append(numberToWords(dinars));
        sb.append(dinars > 1 ? " DINARS" : " DINAR");
        if (millimes > 0) {
            sb.append(" ").append(numberToWords(millimes));
            sb.append(millimes > 1 ? " MILLIMES" : " MILLIME");
        }
        return sb.toString();
    }

    private static String numberToWords(long n) {
        if (n == 0) return "ZÉRO";
        if (n < 20) return ONES[(int) n];
        if (n < 100) {
            int tens = (int) (n / 10);
            int ones = (int) (n % 10);
            if (tens == 7 || tens == 9) {
                int sub = 10 + ones;
                return TENS[tens] + "-" + ONES[sub];
            }
            if (tens == 8) {
                return ones == 0 ? "QUATRE-VINGTS" : "QUATRE-VINGT-" + ONES[ones];
            }
            if (ones == 1) return TENS[tens] + "-ET-UN";
            return TENS[tens] + (ones > 0 ? "-" + ONES[ones] : "");
        }
        if (n < 1000) {
            int h = (int) (n / 100);
            int r = (int) (n % 100);
            String centStr;
            if (h == 1) centStr = "CENT";
            else centStr = ONES[h] + " CENT" + (r == 0 ? "S" : "");
            return centStr + (r > 0 ? " " + numberToWords(r) : "");
        }
        if (n < 1_000_000L) {
            long th  = n / 1000;
            long r   = n % 1000;
            String thousStr = th == 1 ? "MILLE" : numberToWords(th) + " MILLE";
            return thousStr + (r > 0 ? " " + numberToWords(r) : "");
        }
        long mil = n / 1_000_000L;
        long r   = n % 1_000_000L;
        return numberToWords(mil) + " MILLION" + (mil > 1 ? "S" : "") + (r > 0 ? " " + numberToWords(r) : "");
    }
}
