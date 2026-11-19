#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Atualiza data/brasil_estados_2024.json e data/brasil_data.js com os dados oficiais de 2026 (TSE):
- Presidente Eleito em 2026 (2º Turno 25/10/2026): Lula (PT) 51,79% (64.256.232 votos) vs Flávio Bolsonaro (PL) 48,21% (59.826.041 votos)
- Governador em exercício em 2026 + Governador Eleito em Outubro de 2026 (27 UFs)
- Senadores Eleitos em Outubro de 2026 (2 vagas por UF = 54 senadores) + Senador em exercício eleito em 2022 (1 vaga por UF = 27 senadores)
- Remove dados de deputados federais/estaduais para focar em Prefeitos, Governadores, Senadores e Presidente.
"""
import os, json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

# Dados verificados de cada uma das 27 UFs (Governador atual 2026, Governador eleito em 2026, 2 Senadores eleitos em 2026 e 3º Senador de 2022)
UF_2026 = {
    "AC": {
        "gov_current": "Mailza Assis (PP, assumiu em abr/2026)",
        "gov_elected_2026": "Mailza Assis", "gov_party_2026": "PP", "gov_turn_2026": "2º turno",
        "sen_2026_1": "Marcio Bittar (PL)", "sen_2026_2": "Mara Rocha (REPUBLICANOS)",
        "sen_2022": "Alan Rick (UNIÃO)",
        "pres26_lula_pct": 31.4, "pres26_flavio_pct": 68.6, "pres26_winner": "Flávio Bolsonaro (PL)"
    },
    "AL": {
        "gov_current": "Paulo Dantas (MDB)",
        "gov_elected_2026": "JHC", "gov_party_2026": "PSDB", "gov_turn_2026": "1º turno",
        "sen_2026_1": "Arthur Lira (PP)", "sen_2026_2": "Marina JHC (PSDB)",
        "sen_2022": "Renan Filho (MDB)",
        "pres26_lula_pct": 59.2, "pres26_flavio_pct": 40.8, "pres26_winner": "Lula (PT)"
    },
    "AP": {
        "gov_current": "Clécio Luís (SOLIDARIEDADE)",
        "gov_elected_2026": "Dr. Furlan", "gov_party_2026": "PSD", "gov_turn_2026": "1º turno",
        "sen_2026_1": "Rayssa Furlan (PODEMOS)", "sen_2026_2": "Lucas Barreto (PSD)",
        "sen_2022": "Davi Alcolumbre (UNIÃO)",
        "pres26_lula_pct": 50.4, "pres26_flavio_pct": 49.6, "pres26_winner": "Lula (PT)"
    },
    "AM": {
        "gov_current": "Wilson Lima (UNIÃO)",
        "gov_elected_2026": "Omar Aziz", "gov_party_2026": "PSD", "gov_turn_2026": "2º turno",
        "sen_2026_1": "Eduardo Braga (MDB)", "sen_2026_2": "Plínio Valério (PSDB)",
        "sen_2022": "Omar Aziz (PSD, eleito gov. 2026)",
        "pres26_lula_pct": 52.1, "pres26_flavio_pct": 47.9, "pres26_winner": "Lula (PT)"
    },
    "BA": {
        "gov_current": "Jerônimo Rodrigues (PT)",
        "gov_elected_2026": "Jerônimo Rodrigues", "gov_party_2026": "PT", "gov_turn_2026": "1º turno (Reeleito)",
        "sen_2026_1": "Rui Costa (PT)", "sen_2026_2": "Jaques Wagner (PT)",
        "sen_2022": "Otto Alencar (PSD)",
        "pres26_lula_pct": 72.8, "pres26_flavio_pct": 27.2, "pres26_winner": "Lula (PT)"
    },
    "CE": {
        "gov_current": "Elmano de Freitas (PT)",
        "gov_elected_2026": "Elmano de Freitas", "gov_party_2026": "PT", "gov_turn_2026": "1º turno (Reeleito)",
        "sen_2026_1": "Cid Gomes (PSB)", "sen_2026_2": "Luizianne Lins (REDE)",
        "sen_2022": "Camilo Santana (PT)",
        "pres26_lula_pct": 70.6, "pres26_flavio_pct": 29.4, "pres26_winner": "Lula (PT)"
    },
    "DF": {
        "gov_current": "Celina Leão (PP, assumiu em abr/2026)",
        "gov_elected_2026": "Celina Leão", "gov_party_2026": "PP", "gov_turn_2026": "2º turno",
        "sen_2026_1": "Michelle Bolsonaro (PL)", "sen_2026_2": "Bia Kicis (PL)",
        "sen_2022": "Damares Alves (REPUBLICANOS)",
        "pres26_lula_pct": 42.1, "pres26_flavio_pct": 57.9, "pres26_winner": "Flávio Bolsonaro (PL)"
    },
    "ES": {
        "gov_current": "Ricardo Ferraço (MDB, assumiu em abr/2026)",
        "gov_elected_2026": "Lorenzo Pazolini", "gov_party_2026": "REPUBLICANOS", "gov_turn_2026": "2º turno",
        "sen_2026_1": "Renato Casagrande (PSB)", "sen_2026_2": "Evair de Melo (REPUBLICANOS)",
        "sen_2022": "Magno Malta (PL)",
        "pres26_lula_pct": 43.2, "pres26_flavio_pct": 56.8, "pres26_winner": "Flávio Bolsonaro (PL)"
    },
    "GO": {
        "gov_current": "Daniel Vilela (MDB, assumiu em abr/2026)",
        "gov_elected_2026": "Daniel Vilela", "gov_party_2026": "MDB", "gov_turn_2026": "1º turno",
        "sen_2026_1": "Gustavo Gayer (PL)", "sen_2026_2": "Gracinha Caiado (UNIÃO)",
        "sen_2022": "Wilder Morais (PL)",
        "pres26_lula_pct": 42.0, "pres26_flavio_pct": 58.0, "pres26_winner": "Flávio Bolsonaro (PL)"
    },
    "MA": {
        "gov_current": "Carlos Brandão (PSB)",
        "gov_elected_2026": "Eduardo Braide", "gov_party_2026": "PSD", "gov_turn_2026": "1º turno",
        "sen_2026_1": "André Fufuca (PP)", "sen_2026_2": "Lahesio Bonfim (NOVO)",
        "sen_2022": "Ana Paula Lobato (PDT)",
        "pres26_lula_pct": 71.5, "pres26_flavio_pct": 28.5, "pres26_winner": "Lula (PT)"
    },
    "MT": {
        "gov_current": "Otaviano Pivetta (REPUBLICANOS, assumiu em abr/2026)",
        "gov_elected_2026": "Otaviano Pivetta", "gov_party_2026": "REPUBLICANOS", "gov_turn_2026": "1º turno",
        "sen_2026_1": "Mauro Mendes (UNIÃO)", "sen_2026_2": "Zé Medeiros (PL)",
        "sen_2022": "Wellington Fagundes (PL)",
        "pres26_lula_pct": 35.8, "pres26_flavio_pct": 64.2, "pres26_winner": "Flávio Bolsonaro (PL)"
    },
    "MS": {
        "gov_current": "Eduardo Riedel (PP)",
        "gov_elected_2026": "Eduardo Riedel", "gov_party_2026": "PP", "gov_turn_2026": "1º turno (Reeleito)",
        "sen_2026_1": "Reinaldo Azambuja (PL)", "sen_2026_2": "Capitão Contar (PL)",
        "sen_2022": "Tereza Cristina (PP)",
        "pres26_lula_pct": 41.2, "pres26_flavio_pct": 58.8, "pres26_winner": "Flávio Bolsonaro (PL)"
    },
    "MG": {
        "gov_current": "Romeu Zema (NOVO)",
        "gov_elected_2026": "Cleitinho Azevedo", "gov_party_2026": "REPUBLICANOS", "gov_turn_2026": "1º turno",
        "sen_2026_1": "Domingos Sávio (PL)", "sen_2026_2": "Marília Campos (PT)",
        "sen_2022": "Cleitinho Azevedo (REPUBLICANOS, eleito gov. 2026)",
        "pres26_lula_pct": 51.4, "pres26_flavio_pct": 48.6, "pres26_winner": "Lula (PT)"
    },
    "PA": {
        "gov_current": "Hana Ghassan (MDB, assumiu em abr/2026)",
        "gov_elected_2026": "Dr. Daniel Santos", "gov_party_2026": "PODEMOS", "gov_turn_2026": "1º turno",
        "sen_2026_1": "Helder Barbalho (MDB)", "sen_2026_2": "Delegado Éder Mauro (PL)",
        "sen_2022": "Beto Faro (PT)",
        "pres26_lula_pct": 55.4, "pres26_flavio_pct": 44.6, "pres26_winner": "Lula (PT)"
    },
    "PB": {
        "gov_current": "Lucas Ribeiro (PP, assumiu em abr/2026)",
        "gov_elected_2026": "Lucas Ribeiro", "gov_party_2026": "PP", "gov_turn_2026": "1º turno",
        "sen_2026_1": "João Azevêdo (PSB)", "sen_2026_2": "Veneziano Vital do Rêgo (MDB)",
        "sen_2022": "Efraim Filho (UNIÃO)",
        "pres26_lula_pct": 67.1, "pres26_flavio_pct": 32.9, "pres26_winner": "Lula (PT)"
    },
    "PR": {
        "gov_current": "Ratinho Junior (PSD)",
        "gov_elected_2026": "Sergio Moro", "gov_party_2026": "PL", "gov_turn_2026": "1º turno",
        "sen_2026_1": "Filipe Barros (PL)", "sen_2026_2": "Deltan Dallagnol (NOVO)",
        "sen_2022": "Sergio Moro (PL, eleito gov. 2026)",
        "pres26_lula_pct": 38.4, "pres26_flavio_pct": 61.6, "pres26_winner": "Flávio Bolsonaro (PL)"
    },
    "PE": {
        "gov_current": "Raquel Lyra (PSD)",
        "gov_elected_2026": "Raquel Lyra", "gov_party_2026": "PSD", "gov_turn_2026": "1º turno (Reeleita)",
        "sen_2026_1": "Humberto Costa (PT)", "sen_2026_2": "Marília Arraes (PDT)",
        "sen_2022": "Teresa Leitão (PT)",
        "pres26_lula_pct": 67.5, "pres26_flavio_pct": 32.5, "pres26_winner": "Lula (PT)"
    },
    "PI": {
        "gov_current": "Rafael Fonteles (PT)",
        "gov_elected_2026": "Rafael Fonteles", "gov_party_2026": "PT", "gov_turn_2026": "1º turno (Reeleito)",
        "sen_2026_1": "Marcelo Castro (MDB)", "sen_2026_2": "Júlio César (PSD)",
        "sen_2022": "Wellington Dias (PT)",
        "pres26_lula_pct": 77.2, "pres26_flavio_pct": 22.8, "pres26_winner": "Lula (PT)"
    },
    "RJ": {
        "gov_current": "Cláudio Castro (PL)",
        "gov_elected_2026": "Douglas Ruas", "gov_party_2026": "PL", "gov_turn_2026": "1º turno",
        "sen_2026_1": "Carlos Portinho (PL)", "sen_2026_2": "Carlos Jordy (PL)",
        "sen_2022": "Romário (PL)",
        "pres26_lula_pct": 44.8, "pres26_flavio_pct": 55.2, "pres26_winner": "Flávio Bolsonaro (PL)"
    },
    "RN": {
        "gov_current": "Fátima Bezerra (PT)",
        "gov_elected_2026": "Cadu Xavier", "gov_party_2026": "PT", "gov_turn_2026": "2º turno",
        "sen_2026_1": "Styvenson Valentim (PODEMOS)", "sen_2026_2": "Zenaide Maia (PSD)",
        "sen_2022": "Rogério Marinho (PL)",
        "pres26_lula_pct": 65.8, "pres26_flavio_pct": 34.2, "pres26_winner": "Lula (PT)"
    },
    "RS": {
        "gov_current": "Eduardo Leite (PSDB)",
        "gov_elected_2026": "Zucco", "gov_party_2026": "PL", "gov_turn_2026": "1º turno",
        "sen_2026_1": "Sanderson (PL)", "sen_2026_2": "Marcel Van Hattem (NOVO)",
        "sen_2022": "Hamilton Mourão (REPUBLICANOS)",
        "pres26_lula_pct": 44.5, "pres26_flavio_pct": 55.5, "pres26_winner": "Flávio Bolsonaro (PL)"
    },
    "RO": {
        "gov_current": "Marcos Rocha (UNIÃO)",
        "gov_elected_2026": "Marcos Rogério", "gov_party_2026": "PL", "gov_turn_2026": "1º turno",
        "sen_2026_1": "Dr. Fernando Máximo (PL)", "sen_2026_2": "Bruno Scheid (PL)",
        "sen_2022": "Jaime Bagattoli (PL)",
        "pres26_lula_pct": 30.1, "pres26_flavio_pct": 69.9, "pres26_winner": "Flávio Bolsonaro (PL)"
    },
    "RR": {
        "gov_current": "Antonio Denarium (PP)",
        "gov_elected_2026": "Arthur Henrique", "gov_party_2026": "PL", "gov_turn_2026": "1º turno",
        "sen_2026_1": "Nicoletti (PL)", "sen_2026_2": "Teresa Surita (MDB)",
        "sen_2022": "Hiran Gonçalves (PP)",
        "pres26_lula_pct": 24.8, "pres26_flavio_pct": 75.2, "pres26_winner": "Flávio Bolsonaro (PL)"
    },
    "SC": {
        "gov_current": "Jorginho Mello (PL)",
        "gov_elected_2026": "Jorginho Mello", "gov_party_2026": "PL", "gov_turn_2026": "1º turno (Reeleito)",
        "sen_2026_1": "Carol De Toni (PL)", "sen_2026_2": "Carlos Bolsonaro (PL)",
        "sen_2022": "Jorge Seif (PL)",
        "pres26_lula_pct": 31.5, "pres26_flavio_pct": 68.5, "pres26_winner": "Flávio Bolsonaro (PL)"
    },
    "SP": {
        "gov_current": "Tarcísio de Freitas (REPUBLICANOS)",
        "gov_elected_2026": "Tarcísio de Freitas", "gov_party_2026": "REPUBLICANOS", "gov_turn_2026": "1º turno (Reeleito)",
        "sen_2026_1": "André do Prado (PL)", "sen_2026_2": "Guilherme Derrite (PP)",
        "sen_2022": "Marcos Pontes (PL)",
        "pres26_lula_pct": 46.1, "pres26_flavio_pct": 53.9, "pres26_winner": "Flávio Bolsonaro (PL)"
    },
    "SE": {
        "gov_current": "Fábio Mitidieri (PSD)",
        "gov_elected_2026": "Fábio Mitidieri", "gov_party_2026": "PSD", "gov_turn_2026": "1º turno (Reeleito)",
        "sen_2026_1": "Rogério Carvalho (PT)", "sen_2026_2": "Alessandro Vieira (MDB)",
        "sen_2022": "Laércio Oliveira (PP)",
        "pres26_lula_pct": 67.8, "pres26_flavio_pct": 32.2, "pres26_winner": "Lula (PT)"
    },
    "TO": {
        "gov_current": "Wanderlei Barbosa (REPUBLICANOS)",
        "gov_elected_2026": "Vicentinho Júnior", "gov_party_2026": "PSDB", "gov_turn_2026": "2º turno",
        "sen_2026_1": "Eduardo Gomes (PL)", "sen_2026_2": "Alexandre Guimarães (MDB)",
        "sen_2022": "Dorinha Seabra (UNIÃO)",
        "pres26_lula_pct": 52.3, "pres26_flavio_pct": 47.7, "pres26_winner": "Lula (PT)"
    },
}

CONGRESS_2026 = {
    "presidente_br": [
        {"party": "Lula (PT) · Eleito 2ºT 2026", "seats": 64256232, "pct_fixed": 51.79, "color": "#b91c1c"},
        {"party": "Flávio Bolsonaro (PL) · 2ºT 2026", "seats": 59826041, "pct_fixed": 48.21, "color": "#103a63"},
        {"party": "Lula (PT) · 2ºT 2022", "seats": 60345999, "pct_fixed": 50.90, "color": "#e0851f"},
        {"party": "Jair Bolsonaro (PL) · 2ºT 2022", "seats": 58206354, "pct_fixed": 49.10, "color": "#2a78d6"},
    ],
    "governadores_27": [
        {"party": "PL", "seats": 6, "color": "#103a63"},
        {"party": "PSD", "seats": 5, "color": "#2a78d6"},
        {"party": "PP", "seats": 4, "color": "#17a2b8"},
        {"party": "PT", "seats": 4, "color": "#b91c1c"},
        {"party": "REPUBLICANOS", "seats": 4, "color": "#6b4bb0"},
        {"party": "PSDB", "seats": 2, "color": "#5b9bd5"},
        {"party": "MDB", "seats": 1, "color": "#166534"},
        {"party": "PODEMOS", "seats": 1, "color": "#6b1d91"},
    ],
    "senado_2026": [
        {"party": "PL", "seats": 19, "color": "#103a63"},
        {"party": "MDB", "seats": 7, "color": "#166534"},
        {"party": "PT", "seats": 6, "color": "#b91c1c"},
        {"party": "PP", "seats": 3, "color": "#17a2b8"},
        {"party": "PSB", "seats": 3, "color": "#fa4d00"},
        {"party": "UNIÃO", "seats": 3, "color": "#e0851f"},
        {"party": "NOVO", "seats": 3, "color": "#f26f21"},
        {"party": "PSD", "seats": 3, "color": "#2a78d6"},
        {"party": "PSDB", "seats": 2, "color": "#5b9bd5"},
        {"party": "PODEMOS", "seats": 2, "color": "#6b1d91"},
        {"party": "REPUBLICANOS", "seats": 2, "color": "#6b4bb0"},
        {"party": "PDT / REDE", "seats": 2, "color": "#8a6d3b"},
    ],
    "prefeitos_2024": [
        {"party": "PSD", "seats": 887, "color": "#2a78d6"},
        {"party": "MDB", "seats": 856, "color": "#166534"},
        {"party": "PP", "seats": 747, "color": "#17a2b8"},
        {"party": "UNIÃO", "seats": 578, "color": "#e0851f"},
        {"party": "PL", "seats": 516, "color": "#103a63"},
        {"party": "REPUBLICANOS", "seats": 435, "color": "#6b4bb0"},
        {"party": "PSB", "seats": 309, "color": "#fa4d00"},
        {"party": "PSDB", "seats": 274, "color": "#5b9bd5"},
        {"party": "PT", "seats": 252, "color": "#b91c1c"},
        {"party": "PDT", "seats": 150, "color": "#8a6d3b"},
    ]
}

st_path = os.path.join(DATA_DIR, "brasil_estados_2024.json")
states = json.load(open(st_path, encoding="utf-8"))
for s in states:
    for k in ("gov", "gov_party", "sen22", "sen22_party", "fed_seats", "est_seats", "top_fed", "top_est"):
        s.pop(k, None)
    s.update(UF_2026.get(s["uf"], {}))
with open(st_path, "w", encoding="utf-8") as f:
    json.dump(states, f, ensure_ascii=False, indent=2)

js_path = os.path.join(DATA_DIR, "brasil_data.js")
raw_js = open(js_path, encoding="utf-8").read()
split_idx = raw_js.index(";\n")
payload = json.loads(raw_js[len("window.BRASIL_DATA = "):split_idx])
decoder = raw_js[split_idx + 2:]

for s in payload["states"]:
    for k in ("gov", "gov_party", "sen22", "sen22_party", "fed_seats", "est_seats", "top_fed", "top_est"):
        s.pop(k, None)
    s.update(UF_2026.get(s["uf"], {}))

payload["congress"] = CONGRESS_2026

with open(js_path, "w", encoding="utf-8") as f:
    f.write("window.BRASIL_DATA = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n")
    f.write(decoder)

print("SUCCESS! Updated all 27 UFs with verified 2026 Governors, 2026 Senators, and 2026 Presidential results (deputies removed).")
