#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Coleta OFICIAL via API do IBGE (servicodados.ibge.gov.br) para TODOS os 5.570 municípios do Brasil:
1. Localidades (5.570 municípios: id IBGE, nome, UF, região)
2. SIDRA Tabela 6579 (Estimativas da População 2024, variável 9324)
3. SIDRA Tabela 4714 (Censo Demográfico 2022: variável 93 = População 2022, variável 6318 = Área km²)
Salva cache local em data/raw_ibge/ para processamento offline em scripts/process_ibge_tse_data.py.
"""
import os
import json
import urllib.request

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw_ibge")
os.makedirs(RAW_DIR, exist_ok=True)

URLS = {
    "localidades.json": "https://servicodados.ibge.gov.br/api/v1/localidades/municipios",
    "pop2024_t6579.json": "https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/2024/variaveis/9324?localidades=N6[all]",
    "censo2022_pop_t4714.json": "https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93?localidades=N6[all]",
    "censo2022_area_t4714.json": "https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/6318?localidades=N6[all]",
}

headers = {"User-Agent": "Brasil5570-DataJournalism/2.0 (IBGE Public API)"}

for fname, url in URLS.items():
    out_path = os.path.join(RAW_DIR, fname)
    print(f"Downloading {fname} ...")
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
    with open(out_path, "wb") as f:
        f.write(data)
    print(f"  Saved {fname}: {len(data):,} bytes")

print("ALL 5.570 IBGE DATASETS DOWNLOADED SUCCESSFULLY.")
