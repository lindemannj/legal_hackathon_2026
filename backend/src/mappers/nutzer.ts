import type { Benutzer, BenutzerEinheit, Einheit, Gericht } from "@prisma/client";

type BenutzerMitEinheiten = Benutzer & {
  einheiten: (BenutzerEinheit & { einheit: Einheit & { gericht: Gericht } })[];
};

export function alsNutzer(b: BenutzerMitEinheiten) {
  const einheiten = b.einheiten.map((be) => be.einheit);
  const gericht = einheiten[0]?.gericht;
  return {
    id: b.id,
    kennung: b.kennung,
    name: b.name,
    amtsbezeichnung: b.amtsbezeichnung,
    gerichtId: gericht?.id ?? "",
    gericht: gericht?.name ?? "",
    einheiten: einheiten.map((e) => ({ id: e.id, bezeichnung: e.bezeichnung })),
  };
}
