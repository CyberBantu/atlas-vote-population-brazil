# Atlas do Voto e da População (Brasil 2024 a 2026)

Ensaio de jornalismo visual e análise interativa de dados cruzando o retrato demográfico oficial de **todos os 5.571 municípios brasileiros** (**IBGE Estimativas da População 2024** e **Censo Demográfico 2022**) com o ciclo eleitoral e fiscal de **2024 a 2026** (**TSE**: Prefeitos, Governadores, Senadores, Presidente da República e Ajuste Fiscal).

## Estrutura do Projeto

```text
├── index.html                  # Página narrativa principal (Scrollytelling, Globo 3D, Mapas e Gráficos)
├── metodologia.html            # Documentação técnica, fontes primárias e fórmulas
├── autor.html                  # Página breve sobre quem produziu o projeto
├── assets/
│   └── img/                    # Ilustrações 3D dos Três Poderes e foto do autor
├── styles/
│   ├── fonts.css               # Tipografia editorial embutida
│   └── main.css                # Sistema visual, layout scrollytelling e modo claro/escuro
├── js/
│   ├── charts.js               # Motor de visualizações (Three.js, D3.js v7 e Leaflet 100% vetorial)
│   └── app.js                  # Controlador de narrativa, cenário 3D, explorador e comparador municipal
├── data/
│   └── brasil_data.js          # Base consolidada otimizada (5.571 municípios IBGE + 27 UFs TSE 2024 a 2026)
└── scripts/
    ├── fetch_all_5570_ibge.py                   # Coletor oficial da API do IBGE (Localidades + SIDRA 6579 e 4714)
    ├── build_all_5570_dataset.py                # Processador e cruzamento municipal IBGE + TSE
    └── update_2026_governors_senators_president.py # Mapeamento de Governadores, Senadores e Presidente (TSE 2026)
```

## Tecnologias Utilizadas

- **Python 3**: Coleta e processamento de dados abertos via API do IBGE (`servicodados.ibge.gov.br`, Tabelas SIDRA `6579` e `4714`) e dados consolidados do TSE.
- **D3.js v7**: Gráficos interativos com marcadores de fatos e notícias, série histórica dos Censos (1970 a 2024), mapa estadual, rankings, treemap regional, câmbio/pacote fiscal e escada do poder.
- **Three.js**: Globo 3D interativo com Mapa-Múndi, América Latina e extrusão populacional das 27 Unidades da Federação.
- **Leaflet (Base 100% Vetorial Canvas)**: Mapa interativo com todos os 5.571 municípios brasileiros sem dependência de chave de API externa.
- **GSAP + ScrollTrigger**: Transições graduais vinculadas à rolagem.

## Como Executar Localmente

O projeto funciona diretamente abrindo `index.html` no navegador ou servindo a pasta raiz por HTTP:

```bash
python -m http.server 8765
```

Acesse `http://127.0.0.1:8765/index.html`.

## Autoria

Produzido por **Christian Basilio Oliveira** ([LinkedIn](https://www.linkedin.com/in/christianbasilio/)) · [Civika Data](https://civikadata.netlify.app/)
