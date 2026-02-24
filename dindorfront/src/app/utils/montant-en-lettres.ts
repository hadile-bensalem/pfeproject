/**
 * Conversion montant numérique -> montant en lettres (Français - Dinars tunisiens)
 * Ex: 10000 -> "DIX MILLE DINARS"
 */
const UNITES = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF'];
const DIZAINES = ['', 'DIX', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE', 'QUATRE-VINGT', 'QUATRE-VINGT'];
const DIZAINES_SPECIALES: Record<number, string> = {
  11: 'ONZE', 12: 'DOUZE', 13: 'TREIZE', 14: 'QUATORZE', 15: 'QUINZE',
  16: 'SEIZE', 17: 'DIX-SEPT', 18: 'DIX-HUIT', 19: 'DIX-NEUF'
};
const CENTAINES = ['', 'CENT', 'DEUX CENT', 'TROIS CENT', 'QUATRE CENT', 'CINQ CENT', 'SIX CENT', 'SEPT CENT', 'HUIT CENT', 'NEUF CENT'];

function convertirTroisChiffres(n: number): string {
  if (n === 0) return '';
  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;
  let result = CENTAINES[c];
  if (d === 1 && u >= 1) {
    result += (result ? ' ' : '') + DIZAINES_SPECIALES[10 + u];
  } else {
    if (d > 0) result += (result ? ' ' : '') + DIZAINES[d];
    if (d === 7 || d === 9) result += (result ? ' ' : '') + DIZAINES_SPECIALES[10 + u];
    else if (u > 0) result += (result ? ' ' : '') + (d === 8 && u === 1 ? '' : UNITES[u]);
  }
  return result.trim();
}

export function montantEnLettres(montant: number): string {
  if (montant === 0) return 'ZÉRO DINAR';
  const entier = Math.floor(montant);
  const dec = Math.round((montant - entier) * 100);
  let lettres = '';
  if (entier >= 1000000) {
    const m = Math.floor(entier / 1000000);
    lettres += convertirTroisChiffres(m) + ' MILLION' + (m > 1 ? 'S' : '') + ' ';
  }
  if (entier >= 1000) {
    const k = Math.floor((entier % 1000000) / 1000);
    if (k > 0) {
      lettres += (k === 1 ? 'MILLE ' : convertirTroisChiffres(k) + ' MILLE ');
    }
  }
  const rest = entier % 1000;
  if (rest > 0 || !lettres) {
    lettres += convertirTroisChiffres(rest);
  }
  lettres = lettres.trim();
  lettres += ' DINAR' + (entier > 1 ? 'S' : '');
  if (dec > 0) {
    lettres += ' ET ' + (dec < 10 ? UNITES[dec] : convertirTroisChiffres(dec)) + ' MILLIME' + (dec > 1 ? 'S' : '');
  }
  return lettres;
}
