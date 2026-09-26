"""SQLite storage. Table and column names match the former Prisma database."""

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


SCHEMA = """
CREATE TABLE IF NOT EXISTS Gericht (
  id TEXT PRIMARY KEY, art TEXT NOT NULL, name TEXT NOT NULL, bezirk TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS Einheit (
  id TEXT PRIMARY KEY, gerichtId TEXT NOT NULL, bezeichnung TEXT NOT NULL,
  zustaendigkeit TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS Benutzer (
  id TEXT PRIMARY KEY, kennung TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  amtsbezeichnung TEXT NOT NULL, rolle TEXT NOT NULL,
  demoKonto INTEGER NOT NULL DEFAULT 0, passwortHash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS BenutzerEinheit (
  benutzerId TEXT NOT NULL, einheitId TEXT NOT NULL,
  PRIMARY KEY (benutzerId, einheitId)
);
CREATE TABLE IF NOT EXISTS GvpRegel (
  id TEXT PRIMARY KEY, gerichtId TEXT NOT NULL, einheitId TEXT NOT NULL,
  regelText TEXT NOT NULL, bedingung TEXT NOT NULL,
  prioritaet INTEGER NOT NULL DEFAULT 0, turnusGruppe TEXT
);
CREATE TABLE IF NOT EXISTS Merkmal (
  id TEXT PRIMARY KEY, nr INTEGER NOT NULL, kategorie TEXT NOT NULL,
  titel TEXT NOT NULL, norm TEXT NOT NULL, quelle TEXT NOT NULL,
  beschreibung TEXT NOT NULL, gerichte TEXT NOT NULL,
  platzhalter INTEGER NOT NULL, aktiv INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS Verfahrensregister (
  az TEXT PRIMARY KEY, gerichtId TEXT NOT NULL, parteien TEXT NOT NULL,
  status TEXT NOT NULL, zugestelltAm TEXT
);
CREATE TABLE IF NOT EXISTS Fall (
  id TEXT PRIMARY KEY, version INTEGER NOT NULL DEFAULT 1,
  gerichtId TEXT NOT NULL, einheitId TEXT NOT NULL, richterId TEXT NOT NULL,
  regelId TEXT, vorlaeufigesAz TEXT NOT NULL, eingangAm TEXT NOT NULL,
  uebermittlungsweg TEXT NOT NULL, kostenvorschuss TEXT NOT NULL,
  bearbeitungsstatus TEXT NOT NULL DEFAULT 'eingang',
  nurSimulation INTEGER NOT NULL DEFAULT 0, xjustizXml TEXT NOT NULL,
  extraktion TEXT, auswertungStatus TEXT NOT NULL DEFAULT 'ausstehend',
  ausgewertetAm TEXT, regelwerkVersion TEXT, modellVersion TEXT
);
CREATE TABLE IF NOT EXISTS Dokument (
  id TEXT PRIMARY KEY, fallId TEXT NOT NULL, typ TEXT NOT NULL,
  name TEXT NOT NULL, seiten INTEGER NOT NULL, text TEXT
);
CREATE TABLE IF NOT EXISTS Ergebnis (
  id TEXT PRIMARY KEY, fallId TEXT NOT NULL, merkmalId TEXT NOT NULL,
  status TEXT NOT NULL, relevanz TEXT, text TEXT NOT NULL,
  grundlage TEXT, fundstellen TEXT NOT NULL, bewertung TEXT,
  UNIQUE (fallId, merkmalId)
);
"""


@contextmanager
def connect(path: Path) -> Iterator[sqlite3.Connection]:
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except BaseException:
        connection.rollback()
        raise
    finally:
        connection.close()


def init_db(path: Path) -> None:
    with connect(path) as db:
        db.executescript(SCHEMA)
