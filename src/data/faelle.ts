import type { PruefStatus } from "@/data/checklist";
import type { Gerichtstyp } from "@/data/gvp";
import type { Sachgebiet } from "@/lib/zustaendigkeit";

export interface Befund {
  status: PruefStatus;
  begruendung: string;
  fundstelle?: string;
}

export interface XJustizFeld {
  label: string;
  wert: string;
  abweichung?: boolean;
}

export interface Anlage {
  bezeichnung: string;
  titel: string;
  seiten: number;
}

export interface Fall {
  id: string;
  aktenzeichen: string;
  gericht: string;
  gerichtstyp: Gerichtstyp;
  spruchkoerperId: string;
  klaeger: string;
  beklagte: string;
  ortBeklagte: string;
  gegenstand: string;
  sachgebiet: Sachgebiet;
  streitwert: number;
  streitwertXJustiz?: number;
  eingang: string;
  uebermittlungsweg: string;
  prozessbevollmaechtigte: string | null;
  kostenvorschuss: "bezahlt" | "offen";
  geprueftAm: string;
  klageschrift: string;
  anlagen: Anlage[];
  xjustiz: XJustizFeld[];
  xml: string;
  befunde: Record<string, Befund>;
  nurSimulation?: boolean;
}

export const verfahrensregister = [
  {
    aktenzeichen: "142 C 1187/26",
    parteien: "Petersen ./. Heinrichs",
    status: "zugestellt am 09.09.2026",
  },
];

function xml(fall: {
  az: string;
  gericht: string;
  klaeger: string;
  beklagte: string;
  streitwert: number;
  weg: string;
  sachgebiet: string;
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<xjustiz:nachricht.gds.uebermittlungSchriftgutobjekte
    xmlns:xjustiz="http://www.xjustiz.de" version="3.5.1">
  <nachrichtenkopf>
    <erstellungszeitpunkt>2026-09-25T09:42:11</erstellungszeitpunkt>
    <empfaenger>${fall.gericht}</empfaenger>
    <uebermittlungsweg>${fall.weg}</uebermittlungsweg>
  </nachrichtenkopf>
  <fachdaten>
    <verfahrensdaten>
      <aktenzeichen.vorlaeufig>${fall.az}</aktenzeichen.vorlaeufig>
      <sachgebiet>${fall.sachgebiet}</sachgebiet>
      <streitwert einheit="EUR">${fall.streitwert.toFixed(2)}</streitwert>
    </verfahrensdaten>
    <beteiligter rolle="Klaeger">
      <bezeichnung>${fall.klaeger}</bezeichnung>
    </beteiligter>
    <beteiligter rolle="Beklagter">
      <bezeichnung>${fall.beklagte}</bezeichnung>
    </beteiligter>
  </fachdaten>
</xjustiz:nachricht.gds.uebermittlungSchriftgutobjekte>`;
}

export const faelle: Fall[] = [
  {
    id: "fall-1",
    aktenzeichen: "142 C 1234/26",
    gericht: "Amtsgericht Köln",
    gerichtstyp: "AG",
    spruchkoerperId: "ag-koeln-142",
    klaeger: "Sabine Schneider",
    beklagte: "Baumarkt Kessler GmbH",
    ortBeklagte: "Köln",
    gegenstand: "Rückzahlung des Kaufpreises nach Rücktritt",
    sachgebiet: "allgemein",
    streitwert: 3480,
    eingang: "2026-09-25T09:42:00",
    uebermittlungsweg: "beA",
    prozessbevollmaechtigte: "Rechtsanwältin Lea Brückner, Hohenstaufenring 44, 50674 Köln",
    kostenvorschuss: "bezahlt",
    geprueftAm: "2026-09-25T09:43:00",
    klageschrift: `An das
Amtsgericht Köln
Luxemburger Straße 101
50939 Köln

Klage

der Frau Sabine Schneider, Lindenthalgürtel 18, 50935 Köln,
– Klägerin –

Prozessbevollmächtigte: Rechtsanwältin Lea Brückner, Hohenstaufenring 44, 50674 Köln

gegen

die Baumarkt Kessler GmbH, vertreten durch den Geschäftsführer Hendrik Kessler, Industriestraße 7, 50735 Köln,
– Beklagte –

wegen Rückzahlung des Kaufpreises nach Rücktritt vom Kaufvertrag

Vorläufiger Streitwert: 3.480,00 €

Namens und in Vollmacht der Klägerin erheben wir Klage und werden beantragen:

1. Die Beklagte wird verurteilt, an die Klägerin 3.480,00 € nebst Zinsen in Höhe von fünf Prozentpunkten über dem Basiszinssatz seit dem 14.08.2026 zu zahlen.
2. Die Beklagte trägt die Kosten des Rechtsstreits.

Begründung:

Die Klägerin erwarb bei der Beklagten am 12.05.2026 eine Gartenholz-Terrassenkonstruktion zum Preis von 3.480,00 €.
Beweis: Anlage K1 (Rechnung vom 12.05.2026)

Bereits sechs Wochen nach dem Aufbau zeigten sich an sämtlichen Dielen durchgehende Risse und großflächiger Pilzbefall. Das Material war entgegen der Produktbeschreibung nicht kesseldruckimprägniert. Die Klägerin setzte der Beklagten mit Schreiben vom 30.07.2026 eine Frist zur Nacherfüllung bis zum 13.08.2026.
Beweis: Anlage K2 (Mahnschreiben vom 30.07.2026)

Die Beklagte ließ die Frist fruchtlos verstreichen. Mit Schreiben vom 14.08.2026 erklärte die Klägerin den Rücktritt vom Kaufvertrag. Der Anspruch folgt aus §§ 437 Nr. 2, 323, 346 Abs. 1 BGB. Die Ware steht zur Abholung bereit.

Angaben nach § 253 Abs. 3 ZPO: Ein Güteversuch vor einer Schlichtungsstelle wurde unternommen und ist am 02.09.2026 ohne Einigung geblieben. Der Streitwert wird mit 3.480,00 € angegeben.

Köln, 24.09.2026

Lea Brückner
Rechtsanwältin`,
    anlagen: [
      { bezeichnung: "K1", titel: "Rechnung vom 12.05.2026", seiten: 2 },
      { bezeichnung: "K2", titel: "Mahnschreiben vom 30.07.2026", seiten: 1 },
    ],
    xjustiz: [
      { label: "Absender", wert: "RAin Lea Brückner (beA-Postfach)" },
      { label: "Übermittlungsweg", wert: "beA, § 130a Abs. 4 Nr. 2 ZPO" },
      { label: "Gericht", wert: "Amtsgericht Köln" },
      { label: "Klagepartei", wert: "Sabine Schneider" },
      { label: "Anschrift Klagepartei", wert: "Lindenthalgürtel 18, 50935 Köln" },
      { label: "Beklagte Partei", wert: "Baumarkt Kessler GmbH" },
      { label: "Anschrift beklagte Partei", wert: "Industriestraße 7, 50735 Köln" },
      { label: "Streitwert", wert: "3.480,00 €" },
      { label: "Sachgebiet", wert: "Kaufrecht / allgemeine Zivilsache" },
    ],
    xml: xml({
      az: "142 C 1234/26",
      gericht: "Amtsgericht Köln",
      klaeger: "Sabine Schneider",
      beklagte: "Baumarkt Kessler GmbH",
      streitwert: 3480,
      weg: "beA",
      sachgebiet: "Kaufrecht",
    }),
    befunde: {},
  },
  {
    id: "fall-2",
    aktenzeichen: "142 C 1235/26",
    gericht: "Amtsgericht Köln",
    gerichtstyp: "AG",
    spruchkoerperId: "ag-koeln-142",
    klaeger: "Autohaus Lindner GmbH",
    beklagte: "Markus Engel",
    ortBeklagte: "Köln",
    gegenstand: "Werklohn für Reparaturarbeiten",
    sachgebiet: "allgemein",
    streitwert: 14250,
    eingang: "2026-09-25T08:15:00",
    uebermittlungsweg: "beA",
    prozessbevollmaechtigte: "Rechtsanwalt Dr. Ansgar Pohl, Rudolfplatz 3, 50674 Köln",
    kostenvorschuss: "bezahlt",
    geprueftAm: "2026-09-25T08:16:00",
    klageschrift: `An das
Amtsgericht Köln
Luxemburger Straße 101
50939 Köln

Klage

der Autohaus Lindner GmbH, vertreten durch den Geschäftsführer Peter Lindner, Bonner Straße 210, 50968 Köln,
– Klägerin –

Prozessbevollmächtigter: Rechtsanwalt Dr. Ansgar Pohl, Rudolfplatz 3, 50674 Köln

gegen

Herrn Markus Engel, Aachener Straße 512, 50933 Köln,
– Beklagter –

wegen Werklohnforderung aus einem Reparaturvertrag

Vorläufiger Streitwert: 14.250,00 €

Namens und in Vollmacht der Klägerin erheben wir Klage und werden beantragen:

1. Der Beklagte wird verurteilt, an die Klägerin 14.250,00 € nebst Zinsen in Höhe von neun Prozentpunkten über dem Basiszinssatz seit dem 05.09.2026 zu zahlen.
2. Der Beklagte trägt die Kosten des Rechtsstreits.

Begründung:

Der Beklagte beauftragte die Klägerin am 03.07.2026 mit der Instandsetzung des Motors und des Getriebes seines Fahrzeugs. Grundlage war ein schriftlicher Kostenvoranschlag, den der Beklagte gegenzeichnete.
Beweis: Anlage K1 (Reparaturauftrag vom 03.07.2026)

Die Klägerin führte die Arbeiten vollständig aus und stellte das Fahrzeug am 21.08.2026 fertig. Die Rechnung über 14.250,00 € ist dem Beklagten am 22.08.2026 zugegangen.
Beweis: Anlage K2 (Rechnung vom 22.08.2026)

Trotz Mahnung vom 04.09.2026 leistete der Beklagte keine Zahlung. Einwendungen gegen Umfang und Qualität der Arbeiten hat er nicht erhoben. Der Anspruch folgt aus § 631 Abs. 1 BGB, der Zinsanspruch aus §§ 286, 288 Abs. 2 BGB.
Beweis: Anlage K3 (Mahnung vom 04.09.2026)

Angaben nach § 253 Abs. 3 ZPO: Ein Mediations- oder Schlichtungsverfahren wurde nicht durchgeführt, da der Beklagte auf Schreiben der Klägerin nicht reagiert hat.

Köln, 24.09.2026

Dr. Ansgar Pohl
Rechtsanwalt`,
    anlagen: [
      { bezeichnung: "K1", titel: "Reparaturauftrag vom 03.07.2026", seiten: 2 },
      { bezeichnung: "K2", titel: "Rechnung vom 22.08.2026", seiten: 3 },
      { bezeichnung: "K3", titel: "Mahnung vom 04.09.2026", seiten: 1 },
    ],
    xjustiz: [
      { label: "Absender", wert: "RA Dr. Ansgar Pohl (beA-Postfach)" },
      { label: "Übermittlungsweg", wert: "beA, § 130a Abs. 4 Nr. 2 ZPO" },
      { label: "Gericht", wert: "Amtsgericht Köln" },
      { label: "Klagepartei", wert: "Autohaus Lindner GmbH" },
      { label: "Anschrift Klagepartei", wert: "Bonner Straße 210, 50968 Köln" },
      { label: "Beklagte Partei", wert: "Markus Engel" },
      { label: "Anschrift beklagte Partei", wert: "Aachener Straße 512, 50933 Köln" },
      { label: "Streitwert", wert: "14.250,00 €" },
      { label: "Sachgebiet", wert: "Werkvertragsrecht / allgemeine Zivilsache" },
    ],
    xml: xml({
      az: "142 C 1235/26",
      gericht: "Amtsgericht Köln",
      klaeger: "Autohaus Lindner GmbH",
      beklagte: "Markus Engel",
      streitwert: 14250,
      weg: "beA",
      sachgebiet: "Werkvertragsrecht",
    }),
    befunde: {
      p8: {
        status: "mangel",
        begruendung:
          "Streitwert 14.250,00 € übersteigt 10.000 € (§ 23 Nr. 1 GVG). Zuständig ist das Landgericht Köln (§ 71 Abs. 1 GVG).",
        fundstelle: "14.250,00 €",
      },
    },
  },
  {
    id: "fall-3",
    aktenzeichen: "142 C 1236/26",
    gericht: "Amtsgericht Köln",
    gerichtstyp: "AG",
    spruchkoerperId: "ag-koeln-142",
    klaeger: "Thomas Brandt",
    beklagte: "Florian Aigner",
    ortBeklagte: "München",
    gegenstand: "Rückzahlung eines Privatdarlehens",
    sachgebiet: "allgemein",
    streitwert: 2000,
    eingang: "2026-09-24T16:10:00",
    uebermittlungsweg: "Mein Justizpostfach",
    prozessbevollmaechtigte: null,
    kostenvorschuss: "offen",
    geprueftAm: "2026-09-24T16:11:00",
    klageschrift: `An das
Amtsgericht Köln
Luxemburger Straße 101
50939 Köln

Klage

des Herrn Thomas Brandt, Venloer Straße 301, 50823 Köln,
– Kläger, handelnd in eigener Sache –

gegen

Herrn Florian Aigner, Kaiserplatz 6, 80802 München,
– Beklagter –

wegen Rückzahlung eines Privatdarlehens

Vorläufiger Streitwert: 2.000,00 €

Ich erhebe Klage und werde beantragen:

1. Der Beklagte wird verurteilt, an den Kläger 2.000,00 € nebst Zinsen in Höhe von fünf Prozentpunkten über dem Basiszinssatz seit dem 01.08.2026 zu zahlen.
2. Der Beklagte trägt die Kosten des Rechtsstreits.

Begründung:

Der Kläger und der Beklagte kennen sich aus einem gemeinsamen Sportverein. Am 15.01.2026 gewährte der Kläger dem Beklagten ein Darlehen über 2.000,00 €, das dieser zur Anschaffung eines Gebrauchtwagens verwendete. Die Auszahlung erfolgte per Überweisung.
Beweis: Anlage K1 (Kontoauszug vom 15.01.2026)

Die Parteien vereinbarten schriftlich per Textnachricht eine Rückzahlung in einer Summe bis zum 31.07.2026.
Beweis: Anlage K2 (Nachrichtenverlauf vom 15.01.2026)

Der Beklagte zahlte bis heute nichts zurück. Auf die Zahlungserinnerung des Klägers vom 10.08.2026 reagierte er nicht. Der Anspruch folgt aus § 488 Abs. 1 Satz 2 BGB.

Angaben nach § 253 Abs. 3 ZPO: Der Kläger hat den Beklagten mehrfach telefonisch zur gütlichen Beilegung aufgefordert. Ein förmliches Schlichtungsverfahren fand nicht statt. Der Streitwert wird mit 2.000,00 € angegeben.

Köln, 24.09.2026

Thomas Brandt`,
    anlagen: [
      { bezeichnung: "K1", titel: "Kontoauszug vom 15.01.2026", seiten: 1 },
      { bezeichnung: "K2", titel: "Nachrichtenverlauf vom 15.01.2026", seiten: 2 },
    ],
    xjustiz: [
      { label: "Absender", wert: "Thomas Brandt (Mein Justizpostfach)" },
      { label: "Übermittlungsweg", wert: "Mein Justizpostfach, § 130a Abs. 4 Nr. 4 ZPO" },
      { label: "Gericht", wert: "Amtsgericht Köln" },
      { label: "Klagepartei", wert: "Thomas Brandt" },
      { label: "Anschrift Klagepartei", wert: "Venloer Straße 301, 50823 Köln" },
      { label: "Beklagte Partei", wert: "Florian Aigner" },
      { label: "Anschrift beklagte Partei", wert: "Kaiserplatz 6, 80802 München" },
      { label: "Streitwert", wert: "2.000,00 €" },
      { label: "Sachgebiet", wert: "Darlehensrecht / allgemeine Zivilsache" },
    ],
    xml: xml({
      az: "142 C 1236/26",
      gericht: "Amtsgericht Köln",
      klaeger: "Thomas Brandt",
      beklagte: "Florian Aigner",
      streitwert: 2000,
      weg: "MJP",
      sachgebiet: "Darlehensrecht",
    }),
    befunde: {
      p9: {
        status: "mangel",
        begruendung:
          "Wohnsitz des Beklagten in München (§§ 12, 13 ZPO), kein besonderer Gerichtsstand in Köln ersichtlich.",
        fundstelle: "80802 München",
      },
      p24: {
        status: "offen",
        begruendung:
          "Der Gerichtskostenvorschuss ist noch nicht eingegangen. Die Zustellung erfolgt nach Eingang (§ 12 Abs. 1 GKG).",
      },
    },
  },
  {
    id: "fall-4",
    aktenzeichen: "142 C 1237/26",
    gericht: "Amtsgericht Köln",
    gerichtstyp: "AG",
    spruchkoerperId: "ag-koeln-142",
    klaeger: "Nils Petersen",
    beklagte: "Anna Heinrichs",
    ortBeklagte: "Köln",
    gegenstand: "Schadensersatz nach Fahrradunfall",
    sachgebiet: "allgemein",
    streitwert: 1850,
    eingang: "2026-09-24T11:05:00",
    uebermittlungsweg: "beA",
    prozessbevollmaechtigte: "Rechtsanwalt Simon Kreuzer, Neumarkt 12, 50667 Köln",
    kostenvorschuss: "bezahlt",
    geprueftAm: "2026-09-24T11:06:00",
    klageschrift: `An das
Amtsgericht Köln
Luxemburger Straße 101
50939 Köln

Klage

des Herrn Nils Petersen, Sudermanstraße 9, 50670 Köln,
– Kläger –

Prozessbevollmächtigter: Rechtsanwalt Simon Kreuzer, Neumarkt 12, 50667 Köln

gegen

Frau Anna Heinrichs, Eifelplatz 2, 50677 Köln,
– Beklagte –

wegen Schadensersatz aus einem Verkehrsunfall

Vorläufiger Streitwert: 1.850,00 €

Namens und in Vollmacht des Klägers erheben wir Klage und werden beantragen:

1. Die Beklagte wird verurteilt, an den Kläger Schadensersatz in Höhe von 1.850,00 € nebst Zinsen in Höhe von fünf Prozentpunkten über dem Basiszinssatz seit dem 20.08.2026 zu zahlen.
2. Die Beklagte trägt die Kosten des Rechtsstreits.

Begründung:

Am 05.08.2026 kam es auf dem Radweg der Sudermanstraße in Köln zu einer Kollision zwischen den Fahrrädern der Parteien. Die Beklagte wechselte ohne Handzeichen und ohne Rückschau die Fahrspur und stieß mit dem Vorderrad des Klägers zusammen.
Beweis: Anlage K1 (Unfallmitteilung der Polizei vom 05.08.2026)

Am Fahrrad des Klägers entstand ein Sachschaden von 1.640,00 €; hinzu kommen 210,00 € für beschädigte Kleidung und Schutzausrüstung.
Beweis: Anlage K2 (Kostenvoranschlag der Fahrradwerkstatt)

Die Beklagte wies eine Haftung mit Schreiben vom 19.08.2026 zurück. Der Anspruch folgt aus § 823 Abs. 1 BGB in Verbindung mit § 9 Abs. 1 StVO.

Angaben nach § 253 Abs. 3 ZPO: Ein Schlichtungsversuch wurde von der Beklagten abgelehnt. Der Streitwert wird mit 1.850,00 € angegeben.

Köln, 23.09.2026

Simon Kreuzer
Rechtsanwalt`,
    anlagen: [
      { bezeichnung: "K1", titel: "Unfallmitteilung der Polizei", seiten: 3 },
      { bezeichnung: "K2", titel: "Kostenvoranschlag Fahrradwerkstatt", seiten: 1 },
    ],
    xjustiz: [
      { label: "Absender", wert: "RA Simon Kreuzer (beA-Postfach)" },
      { label: "Übermittlungsweg", wert: "beA, § 130a Abs. 4 Nr. 2 ZPO" },
      { label: "Gericht", wert: "Amtsgericht Köln" },
      { label: "Klagepartei", wert: "Nils Petersen" },
      { label: "Anschrift Klagepartei", wert: "Sudermanstraße 9, 50670 Köln" },
      { label: "Beklagte Partei", wert: "Anna Heinrichs" },
      { label: "Anschrift beklagte Partei", wert: "Eifelplatz 2, 50677 Köln" },
      { label: "Streitwert", wert: "1.850,00 €" },
      { label: "Sachgebiet", wert: "Verkehrsunfall / allgemeine Zivilsache" },
    ],
    xml: xml({
      az: "142 C 1237/26",
      gericht: "Amtsgericht Köln",
      klaeger: "Nils Petersen",
      beklagte: "Anna Heinrichs",
      streitwert: 1850,
      weg: "beA",
      sachgebiet: "Verkehrsunfall",
    }),
    befunde: {
      p13: {
        status: "mangel",
        begruendung:
          "Identischer Streitgegenstand bereits rechtshängig unter 142 C 1187/26.",
        fundstelle: "Schadensersatz in Höhe von 1.850,00 €",
      },
    },
  },
  {
    id: "fall-5",
    aktenzeichen: "5 O 311/26",
    gericht: "Landgericht Köln",
    gerichtstyp: "LG",
    spruchkoerperId: "lg-koeln-5",
    klaeger: "Eheleute Krämer",
    beklagte: "Dieter Olbrich",
    ortBeklagte: "Köln",
    gegenstand: "Beseitigung überhängender Äste und Kostenerstattung",
    sachgebiet: "nachbarrecht",
    streitwert: 12500,
    eingang: "2026-09-25T08:50:00",
    uebermittlungsweg: "beA",
    prozessbevollmaechtigte: "Rechtsanwältin Carla Neuhaus, Gereonshof 5, 50670 Köln",
    kostenvorschuss: "bezahlt",
    geprueftAm: "2026-09-25T08:51:00",
    klageschrift: `An das
Landgericht Köln
Luxemburger Straße 101
50939 Köln

Klage

der Eheleute Renate und Jürgen Krämer, Am Buschweg 14, 50999 Köln,
– Kläger –

Prozessbevollmächtigte: Rechtsanwältin Carla Neuhaus, Gereonshof 5, 50670 Köln

gegen

Herrn Dieter Olbrich, Am Buschweg 16, 50999 Köln,
– Beklagter –

wegen nachbarrechtlicher Ansprüche auf Beseitigung von Überhang

Vorläufiger Streitwert: 12.500,00 €

Namens und in Vollmacht der Kläger erheben wir Klage und werden beantragen:

1. Der Beklagte wird verurteilt, die auf das Grundstück der Kläger überhängenden Äste seiner drei Grenzpappeln bis zur Grundstücksgrenze zurückzuschneiden.
2. Der Beklagte wird verurteilt, an die Kläger 4.200,00 € für bereits angefallene Beseitigungs- und Gutachterkosten zu zahlen.
3. Der Beklagte trägt die Kosten des Rechtsstreits.

Begründung:

Die Parteien sind Eigentümer unmittelbar benachbarter Grundstücke. Von den drei Grenzpappeln des Beklagten ragen seit mindestens zwei Jahren Äste bis zu vier Meter weit auf das Grundstück der Kläger.
Beweis: Anlage K1 (Lichtbilder vom 12.06.2026)

Die überhängenden Äste beeinträchtigen die Nutzung der Terrasse erheblich und haben im Frühjahr 2026 zu Dachschäden am Gartenhaus geführt.
Beweis: Anlage K2 (Gutachten des Sachverständigen Dipl.-Ing. Rauch)

Die Kläger setzten dem Beklagten mit Schreiben vom 01.07.2026 eine Frist zur Beseitigung des Überhangs bis zum 15.08.2026. Der Beklagte reagierte nicht. Der Anspruch folgt aus § 1004 Abs. 1 BGB, § 910 BGB sowie § 47 NachbG NRW.

Angaben nach § 253 Abs. 3 ZPO: Der Streitwert wird mit 12.500,00 € angegeben. Einer Entscheidung durch den Einzelrichter wird nicht entgegengetreten.

Köln, 24.09.2026

Carla Neuhaus
Rechtsanwältin`,
    anlagen: [
      { bezeichnung: "K1", titel: "Lichtbilder vom 12.06.2026", seiten: 6 },
      { bezeichnung: "K2", titel: "Gutachten Dipl.-Ing. Rauch", seiten: 14 },
    ],
    xjustiz: [
      { label: "Absender", wert: "RAin Carla Neuhaus (beA-Postfach)" },
      { label: "Übermittlungsweg", wert: "beA, § 130a Abs. 4 Nr. 2 ZPO" },
      { label: "Gericht", wert: "Landgericht Köln" },
      { label: "Klagepartei", wert: "Renate und Jürgen Krämer" },
      { label: "Anschrift Klagepartei", wert: "Am Buschweg 14, 50999 Köln" },
      { label: "Beklagte Partei", wert: "Dieter Olbrich" },
      { label: "Anschrift beklagte Partei", wert: "Am Buschweg 16, 50999 Köln" },
      { label: "Streitwert", wert: "12.500,00 €" },
      { label: "Sachgebiet", wert: "Nachbarrecht" },
    ],
    xml: xml({
      az: "5 O 311/26",
      gericht: "Landgericht Köln",
      klaeger: "Renate und Jürgen Krämer",
      beklagte: "Dieter Olbrich",
      streitwert: 12500,
      weg: "beA",
      sachgebiet: "Nachbarrecht",
    }),
    befunde: {
      p8: {
        status: "mangel",
        begruendung:
          "Nachbarrechtliche Streitigkeit, seit 01.01.2026 unabhängig vom Streitwert beim Amtsgericht (§ 23 Nr. 2 e GVG).",
        fundstelle: "überhängenden Äste",
      },
      p25: {
        status: "pruefen",
        begruendung:
          "Keine Bescheinigung über ein Schlichtungsverfahren beigefügt (§ 15a EGZPO).",
      },
    },
  },
  {
    id: "fall-6",
    aktenzeichen: "5 O 312/26",
    gericht: "Landgericht Köln",
    gerichtstyp: "LG",
    spruchkoerperId: "lg-koeln-5",
    klaeger: "Herbert Vogt",
    beklagte: "Sanitär Reuter GmbH",
    ortBeklagte: "Köln",
    gegenstand: "Schadensersatz nach Wasserschaden",
    sachgebiet: "allgemein",
    streitwert: 25000,
    eingang: "2026-09-24T14:22:00",
    uebermittlungsweg: "Mein Justizpostfach",
    prozessbevollmaechtigte: null,
    kostenvorschuss: "offen",
    geprueftAm: "2026-09-24T14:23:00",
    klageschrift: `An das
Landgericht Köln
Luxemburger Straße 101
50939 Köln

Klage

des Herrn Herbert Vogt, Rösrather Straße 88, 51107 Köln,
– Kläger, handelnd in eigener Sache –

gegen

die Sanitär Reuter GmbH, vertreten durch den Geschäftsführer Olaf Reuter, Frankfurter Straße 140, 51065 Köln,
– Beklagte –

wegen Schadensersatz nach einem Wasserschaden

Vorläufig geschätzter Streitwert: 25.000,00 €

Ich erhebe Klage und werde beantragen:

1. Die Beklagte wird verurteilt, an den Kläger einen angemessenen Schadensersatz zu zahlen.
2. Die Beklagte trägt die Kosten des Rechtsstreits.

Begründung:

Die Beklagte erneuerte im Auftrag des Klägers am 18.05.2026 die Wasserleitungen im Badezimmer seines Einfamilienhauses. Bei der Montage wurde eine Presskupplung nicht ordnungsgemäß verpresst.
Beweis: Anlage K1 (Auftragsbestätigung vom 04.05.2026)

In der Nacht zum 02.06.2026 löste sich die Verbindung. Wasser lief über mehrere Stunden in das Erdgeschoss und in den Keller. Betroffen sind Parkett, Trockenbauwände sowie eingelagerte Möbel.
Beweis: Anlage K2 (Lichtbilder und Schadensaufnahme der Versicherung)

Die Beklagte bestreitet einen Montagefehler. Der Kläger kann den Schaden derzeit nicht abschließend beziffern, da die Trocknung noch andauert und das Gutachten der Versicherung aussteht. Der Anspruch folgt aus §§ 280 Abs. 1, 634 Nr. 4 BGB.

Angaben nach § 253 Abs. 3 ZPO: Ein Schlichtungsverfahren wurde nicht durchgeführt. Der Streitwert wird vorläufig geschätzt.

Köln, 24.09.2026

Herbert Vogt`,
    anlagen: [
      { bezeichnung: "K1", titel: "Auftragsbestätigung vom 04.05.2026", seiten: 1 },
      { bezeichnung: "K2", titel: "Lichtbilder und Schadensaufnahme", seiten: 9 },
    ],
    xjustiz: [
      { label: "Absender", wert: "Herbert Vogt (Mein Justizpostfach)" },
      { label: "Übermittlungsweg", wert: "Mein Justizpostfach, § 130a Abs. 4 Nr. 4 ZPO" },
      { label: "Gericht", wert: "Landgericht Köln" },
      { label: "Klagepartei", wert: "Herbert Vogt" },
      { label: "Anschrift Klagepartei", wert: "Rösrather Straße 88, 51107 Köln" },
      { label: "Beklagte Partei", wert: "Sanitär Reuter GmbH" },
      { label: "Anschrift beklagte Partei", wert: "Frankfurter Straße 140, 51065 Köln" },
      { label: "Streitwert", wert: "25.000,00 € (geschätzt)" },
      { label: "Sachgebiet", wert: "Werkvertragsrecht / allgemeine Zivilsache" },
    ],
    xml: xml({
      az: "5 O 312/26",
      gericht: "Landgericht Köln",
      klaeger: "Herbert Vogt",
      beklagte: "Sanitär Reuter GmbH",
      streitwert: 25000,
      weg: "MJP",
      sachgebiet: "Werkvertragsrecht",
    }),
    befunde: {
      p4: {
        status: "mangel",
        begruendung:
          "Vor dem Landgericht besteht Anwaltszwang (§ 78 Abs. 1 ZPO). Die Klage ist von der Partei selbst eingereicht.",
        fundstelle: "handelnd in eigener Sache",
      },
      p2: {
        status: "pruefen",
        begruendung:
          "Antrag nicht beziffert, keine Größenordnung angegeben. Ein bestimmter Klageantrag ist Voraussetzung eines vollstreckungsfähigen Titels.",
        fundstelle: "einen angemessenen Schadensersatz zu zahlen",
      },
      p23: {
        status: "pruefen",
        begruendung:
          "Eine Äußerung zur Entscheidung durch den Einzelrichter fehlt (§ 253 Abs. 3 Nr. 3 ZPO, Sollvorschrift).",
      },
      p24: {
        status: "offen",
        begruendung:
          "Der Gerichtskostenvorschuss ist noch nicht eingegangen (§ 12 Abs. 1 GKG).",
      },
    },
  },
  {
    id: "fall-7",
    aktenzeichen: "142 C 1240/26",
    gericht: "Amtsgericht Köln",
    gerichtstyp: "AG",
    spruchkoerperId: "ag-koeln-142",
    klaeger: "Immobilien Rhein GmbH",
    beklagte: "Gebäudereinigung Falk GmbH",
    ortBeklagte: "Köln",
    gegenstand: "Rückforderung überzahlter Rechnungen",
    sachgebiet: "allgemein",
    streitwert: 48000,
    streitwertXJustiz: 4800,
    eingang: "2026-09-25T10:05:00",
    uebermittlungsweg: "beA",
    prozessbevollmaechtigte: "Rechtsanwalt Björn Haseloff, Habsburgerring 2, 50674 Köln",
    kostenvorschuss: "bezahlt",
    geprueftAm: "2026-09-25T10:06:00",
    nurSimulation: true,
    klageschrift: `An das
Amtsgericht Köln
Luxemburger Straße 101
50939 Köln

Klage

der Immobilien Rhein GmbH, vertreten durch den Geschäftsführer Robert Sassen, Rheinauhafen 11, 50678 Köln,
– Klägerin –

Prozessbevollmächtigter: Rechtsanwalt Björn Haseloff, Habsburgerring 2, 50674 Köln

gegen

die Gebäudereinigung Falk GmbH, vertreten durch die Geschäftsführerin Sonja Falk, Vogelsanger Straße 320, 50827 Köln,
– Beklagte –

wegen Rückforderung überzahlter Rechnungsbeträge

Vorläufiger Streitwert: 48.000,00 €

Namens und in Vollmacht der Klägerin erheben wir Klage und werden beantragen:

1. Die Beklagte wird verurteilt, an die Klägerin 48.000,00 € nebst Zinsen in Höhe von neun Prozentpunkten über dem Basiszinssatz seit dem 12.09.2026 zu zahlen.
2. Die Beklagte trägt die Kosten des Rechtsstreits.

Begründung:

Die Parteien verband von 2023 bis 2026 ein Rahmenvertrag über die Unterhaltsreinigung von elf Wohnanlagen der Klägerin. Abgerechnet wurde monatlich nach vertraglich festgelegten Quadratmeterpreisen.
Beweis: Anlage K1 (Rahmenvertrag vom 01.03.2023)

Eine interne Prüfung der Klägerin ergab, dass die Beklagte über 24 Monate hinweg Flächen abgerechnet hat, die nicht Vertragsgegenstand waren, sowie Zuschläge, die vertraglich nicht vorgesehen sind. Die Überzahlung beträgt insgesamt 48.000,00 €.
Beweis: Anlage K2 (Abrechnungsübersicht der Klägerin)

Die Klägerin forderte die Beklagte mit Schreiben vom 28.08.2026 zur Rückzahlung bis zum 11.09.2026 auf. Die Beklagte lehnte ab. Der Anspruch folgt aus § 812 Abs. 1 Satz 1 Alt. 1 BGB.
Beweis: Anlage K3 (Schreiben vom 28.08.2026)

Angaben nach § 253 Abs. 3 ZPO: Ein Schlichtungsversuch ist am 15.09.2026 gescheitert. Der Streitwert wird mit 48.000,00 € angegeben.

Köln, 25.09.2026

Björn Haseloff
Rechtsanwalt`,
    anlagen: [
      { bezeichnung: "K1", titel: "Rahmenvertrag vom 01.03.2023", seiten: 11 },
      { bezeichnung: "K2", titel: "Abrechnungsübersicht", seiten: 24 },
      { bezeichnung: "K3", titel: "Schreiben vom 28.08.2026", seiten: 2 },
    ],
    xjustiz: [
      { label: "Absender", wert: "RA Björn Haseloff (beA-Postfach)" },
      { label: "Übermittlungsweg", wert: "beA, § 130a Abs. 4 Nr. 2 ZPO" },
      { label: "Gericht", wert: "Amtsgericht Köln" },
      { label: "Klagepartei", wert: "Immobilien Rhein GmbH" },
      { label: "Anschrift Klagepartei", wert: "Rheinauhafen 11, 50678 Köln" },
      { label: "Beklagte Partei", wert: "Gebäudereinigung Falk GmbH" },
      { label: "Anschrift beklagte Partei", wert: "Vogelsanger Straße 320, 50827 Köln" },
      { label: "Streitwert", wert: "4.800,00 €", abweichung: true },
      { label: "Sachgebiet", wert: "Bereicherungsrecht / allgemeine Zivilsache" },
    ],
    xml: xml({
      az: "142 C 1240/26",
      gericht: "Amtsgericht Köln",
      klaeger: "Immobilien Rhein GmbH",
      beklagte: "Gebäudereinigung Falk GmbH",
      streitwert: 4800,
      weg: "beA",
      sachgebiet: "Bereicherungsrecht",
    }),
    befunde: {
      p19: {
        status: "pruefen",
        begruendung:
          "Streitwert im XJustiz-Datensatz (4.800,00 €) weicht vom Antrag (48.000,00 €) ab.",
        fundstelle: "48.000,00 €",
      },
      p8: {
        status: "mangel",
        begruendung:
          "Nach dem Klageantrag ist das Landgericht zuständig (§ 71 Abs. 1 GVG).",
        fundstelle: "48.000,00 €",
      },
    },
  },
];
