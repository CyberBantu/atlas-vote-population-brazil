/* ==========================================================================
   ATLAS DO VOTO E DA POPULAÇÃO (BRASIL 2024 A 2026)
   Controlador de Scrollytelling, Fundo 3D dos Três Poderes,
   Explorador de Todos os 5.571 Municípios e Comparador Livre Lado a Lado
   ========================================================================== */

(function () {
  "use strict";

  function normStr(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return +(2 * R * Math.asin(Math.sqrt(a))).toFixed(1);
  }

  function initTresPoderes3DBackground() {
    const rig = document.getElementById("bg-poder-rig");
    const layers = {
      congresso: document.getElementById("bg-layer-congresso"),
      planalto: document.getElementById("bg-layer-planalto"),
      stf: document.getElementById("bg-layer-stf")
    };
    const hudAngles = document.getElementById("hud-angles-readout");
    const hudBtns = Array.from(document.querySelectorAll("[data-bg-poder]"));
    if (!rig) return;

    let manualOverride = false;
    let mouseX = 0, mouseY = 0, scrollPct = 0;

    function setActivePoder(key, isManual = false) {
      if (!layers[key]) return;
      if (isManual) manualOverride = true;
      Object.keys(layers).forEach((k) => { if (layers[k]) layers[k].classList.toggle("active", k === key); });
      hudBtns.forEach((b) => b.classList.toggle("active", b.getAttribute("data-bg-poder") === key));
    }

    hudBtns.forEach((btn) => btn.addEventListener("click", () => setActivePoder(btn.getAttribute("data-bg-poder"), true)));
    window.addEventListener("pointermove", (e) => {
      mouseX = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      mouseY = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    }, { passive: true });
    window.addEventListener("scroll", () => {
      const st = window.scrollY || document.documentElement.scrollTop;
      const dh = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollPct = Math.min(1, st / dh);
      if (!manualOverride) {
        if (scrollPct < 0.36) setActivePoder("congresso", false);
        else if (scrollPct < 0.70) setActivePoder("planalto", false);
        else setActivePoder("stf", false);
      }
    }, { passive: true });

    function tick(t) {
      const sec = t * 0.00055;
      const rotY = (scrollPct - 0.5) * 18 + Math.sin(sec) * 4.5 + mouseX * 6.5;
      const rotX = Math.cos(sec * 0.8) * 3.2 - mouseY * 4.5 + (scrollPct - 0.5) * 6;
      const transX = -mouseX * 18 - Math.sin(sec) * 10;
      const transY = -mouseY * 14 - scrollPct * 34;
      const scale = 1.08 + Math.sin(sec * 0.6) * 0.025 + scrollPct * 0.04;
      rig.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translate3d(${transX.toFixed(1)}px, ${transY.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      if (hudAngles) hudAngles.textContent = `ÂNGULO 3D · X:${rotX.toFixed(1)}° Y:${rotY.toFixed(1)}°`;
      requestAnimationFrame(tick);
    }
    setActivePoder("congresso", false);
    requestAnimationFrame(tick);
  }

  document.addEventListener("DOMContentLoaded", function () {
    const data = window.BRASIL_DATA;
    const C = window.DSCharts;
    if (!data || !C) return;

    initTresPoderes3DBackground();

    // Tema Claro / Escuro
    const themeBtn = document.getElementById("btn-theme-toggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        themeBtn.textContent = next === "dark" ? "☀ Modo Claro" : "☾ Modo Escuro";
      });
    }

    // Barra de Progresso
    const progBar = document.getElementById("scroll-progress");
    window.addEventListener("scroll", () => {
      const st = window.scrollY || document.documentElement.scrollTop;
      const dh = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (progBar) progBar.style.width = Math.min(100, (st / dh) * 100).toFixed(1) + "%";
    }, { passive: true });

    // Contadores Animados
    document.querySelectorAll("[data-counter]").forEach((el) => {
      const target = Number(el.getAttribute("data-counter") || 0);
      const start = performance.now();
      function step(now) {
        const p = Math.min(1, (now - start) / 1600);
        el.textContent = C.fmtInt(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });

    // Inicializar todas as visualizações
    C.initHeroGlobe(data);
    C.renderHistoricalCharts(data, "2024");
    C.renderStatesMapAndRank(data, "pop2024");
    C.initMunicipalLeafletMap(data);
    C.renderRankingsSection(data, "top50");
    C.renderTop10AndScatter(data, "SP");
    C.renderRegionsSection(data);
    C.renderGrowthWaffleAndElectoral(data);
    C.renderPowerLadderChart(data, "governadores_27");

    // Dropdowns de UF
    [document.getElementById("filter-mun-uf"), document.getElementById("select-top10-uf")].forEach((sel, idx) => {
      if (!sel) return;
      [...data.states].sort((a, b) => a.uf.localeCompare(b.uf)).forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.uf;
        opt.textContent = `${s.uf}: ${s.name} (${s.mun_count} mun.)`;
        if (idx === 1 && s.uf === "SP") opt.selected = true;
        sel.appendChild(opt);
      });
    });

    const top10UfSel = document.getElementById("select-top10-uf");
    if (top10UfSel) top10UfSel.addEventListener("change", () => C.renderTop10AndScatter(data, top10UfSel.value));

    document.querySelectorAll("[data-uf-metric]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-uf-metric]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        C.renderStatesMapAndRank(data, btn.getAttribute("data-uf-metric"));
      });
    });

    document.querySelectorAll("[data-rank-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-rank-tab]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        C.renderRankingsSection(data, btn.getAttribute("data-rank-tab"));
      });
    });

    document.querySelectorAll("[data-power-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-power-tab]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        C.renderPowerLadderChart(data, btn.getAttribute("data-power-tab"));
      });
    });

    // Motor de Scrollytelling Gradual
    function activateStep(stepEl) {
      if (!stepEl) return;
      const theater = stepEl.closest(".scrolly-theater");
      if (theater) theater.querySelectorAll(".step").forEach((s) => s.classList.remove("on"));
      stepEl.classList.add("on");

      const bannerId = stepEl.getAttribute("data-fact-banner");
      const badge = stepEl.getAttribute("data-fact-badge");
      const headline = stepEl.getAttribute("data-fact-headline");
      const source = stepEl.getAttribute("data-fact-source");
      if (bannerId && badge && headline) C.setFactBanner(bannerId, badge, headline, source || "IBGE / TSE");

      const histYear = stepEl.getAttribute("data-hist-year");
      if (histYear) C.renderHistoricalCharts(data, histYear);

      const ufMetric = stepEl.getAttribute("data-trigger-metric");
      if (ufMetric) {
        document.querySelectorAll("[data-uf-metric]").forEach((b) => b.classList.toggle("active", b.getAttribute("data-uf-metric") === ufMetric));
        C.renderStatesMapAndRank(data, ufMetric);
      }

      const rankMode = stepEl.getAttribute("data-trigger-rank");
      if (rankMode) {
        document.querySelectorAll("[data-rank-tab]").forEach((b) => b.classList.toggle("active", b.getAttribute("data-rank-tab") === rankMode));
        C.renderRankingsSection(data, rankMode);
      }

      const powerTab = stepEl.getAttribute("data-trigger-power");
      if (powerTab) {
        document.querySelectorAll("[data-power-tab]").forEach((b) => b.classList.toggle("active", b.getAttribute("data-power-tab") === powerTab));
        C.renderPowerLadderChart(data, powerTab);
      }
    }

    const stepObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) activateStep(entry.target); });
    }, { rootMargin: "-32% 0px -38% 0px", threshold: 0.05 });

    document.querySelectorAll(".scrolly-theater .step").forEach((st) => {
      stepObserver.observe(st);
      st.addEventListener("click", () => activateStep(st));
    });

    // Helper de Autocomplete reutilizável (Explorador + Comparador Cidade A e Cidade B)
    function bindCityAutocomplete(inputEl, listEl, onSelect) {
      if (!inputEl || !listEl) return;
      inputEl.addEventListener("input", () => {
        const q = normStr(inputEl.value.trim());
        if (q.length < 2) { listEl.style.display = "none"; return; }
        const matches = data.municipios
          .filter((m) => normStr(m.name).includes(q) || normStr(m.uf) === q || String(m.ibge || "") === q)
          .slice(0, 14);
        if (!matches.length) { listEl.style.display = "none"; return; }
        listEl.innerHTML = matches.map((m) => `
          <div class="autocomplete-item" data-id="${m.id}">
            <span><b>${m.name}</b> (${m.uf}) · ${m.region}</span>
            <span class="mono">${C.fmtInt(m.pop2024)} hab. · #${m.rank_national}</span>
          </div>
        `).join("");
        listEl.style.display = "block";
        listEl.querySelectorAll(".autocomplete-item").forEach((it) => {
          it.addEventListener("click", () => {
            const id = it.getAttribute("data-id");
            const found = data.municipios.find((x) => x.id === id);
            if (found) inputEl.value = `${found.name} (${found.uf})`;
            listEl.style.display = "none";
            onSelect(id);
          });
        });
      });
      document.addEventListener("click", (e) => {
        if (!inputEl.contains(e.target) && !listEl.contains(e.target)) listEl.style.display = "none";
      });
    }

    // Explorador de Municípios (Ficha 3 Colunas + 5 Vizinhos)
    const fichaBox = document.getElementById("explorer-ficha-box");
    function findNearest5(m) {
      const sameReg = data.municipios.filter((o) => o.id !== m.id && Math.abs(o.lat - m.lat) < 4.5 && Math.abs(o.lng - m.lng) < 4.5);
      const pool = sameReg.length >= 5 ? sameReg : data.municipios.filter((o) => o.id !== m.id);
      return pool.map((o) => ({ name: o.name, uf: o.uf, pop2024: o.pop2024, dist_km: haversine(m.lat, m.lng, o.lat, o.lng) })).sort((a, b) => a.dist_km - b.dist_km).slice(0, 5);
    }

    function renderFicha(munId, flyMap = false) {
      const m = data.municipios.find((x) => x.id === munId) || data.municipios[0];
      if (!m || !fichaBox) return;
      const st = data.states.find((s) => s.uf === m.uf) || data.states[0];
      const ratioBr = (m.density / data.meta.avg_density).toFixed(1);
      const neighbors = findNearest5(m);

      fichaBox.innerHTML = `
        <div class="chart-head">
          <div>
            <span class="kicker">CÓD. IBGE ${m.ibge || "N/D"} · ${m.region} · ${m.state_name} (${m.uf}) ${m.is_capital ? "· ★ CAPITAL" : ""}</span>
            <h3 class="heading" style="font-size:28px">${m.name} (${m.uf}): ${C.fmtInt(m.pop2024)} habitantes</h3>
          </div>
          <div style="text-align:right">
            <div class="mono" style="color:var(--wnba-tan-dark)">RANKING NACIONAL</div>
            <div class="disp" style="font-size:30px;color:var(--wnba-red)">#${C.fmtInt(m.rank_national)} <span style="font-size:16px;color:var(--wnba-tan-dark)">/ ${C.fmtInt(data.municipios.length)}</span></div>
          </div>
        </div>
        <div class="grid-3">
          <div>
            <div class="mono" style="color:var(--wnba-red)">DEMOGRAFIA OFICIAL (IBGE 2024 & CENSO 2022)</div>
            <dl class="spec">
              <div><dt>População Estimada 2024</dt><dd>${C.fmtInt(m.pop2024)} hab. (${C.fmtDec(m.pct_br, 4)}% BR)</dd></div>
              <div><dt>Censo 2022 e Variação</dt><dd>${C.fmtInt(m.pop2022)} hab. (${m.growth_22_24 >= 0 ? "+" : ""}${C.fmtDec(m.growth_22_24, 2)}%)</dd></div>
              <div><dt>Ranking Estadual (${m.uf})</dt><dd>${m.rank_state}º de ${st.mun_count} municípios (${C.fmtDec(m.pct_state, 2)}% da UF)</dd></div>
              <div><dt>Área e Densidade</dt><dd>${C.fmtDec(m.area, 1)} km² · ${C.fmtDec(m.density, 1)} hab/km² (${ratioBr}× média BR)</dd></div>
            </dl>
          </div>
          <div>
            <div class="mono" style="color:var(--wnba-red)">PODER MUNICIPAL (ELEIÇÕES TSE 2024)</div>
            <dl class="spec">
              <div><dt>Prefeito(a) Eleito(a) 2024</dt><dd>${m.mayor_2024}</dd></div>
              <div><dt>Partido e Votação</dt><dd><span style="color:${C.PARTY_COLORS[m.party_2024] || '#b91c1c'}">${m.party_2024}</span> · ${C.fmtDec(m.vote_pct_2024, 1)}% dos votos</dd></div>
              <div><dt>Comparecimento e Abstenção</dt><dd>${C.fmtDec(m.turnout_2024, 1)}% comparecimento · ${C.fmtDec(m.abstention_2024, 1)}% abstenção</dd></div>
              <div><dt>Câmara Municipal (% Mulheres)</dt><dd>${C.fmtDec(m.women_council_pct, 1)}% vereadoras eleitas</dd></div>
            </dl>
          </div>
          <div>
            <div class="mono" style="color:var(--wnba-red)">GOVERNO, SENADO E PRESIDÊNCIA 2026 (${m.uf})</div>
            <dl class="spec">
              <div><dt>Governador Atual (2026)</dt><dd>${st.gov_current || "N/D"}</dd></div>
              <div><dt>Governador Eleito em 2026</dt><dd><b>${st.gov_elected_2026 || "N/D"} (${st.gov_party_2026 || "N/D"})</b> · ${st.gov_turn_2026 || ""}</dd></div>
              <div><dt>Senadores Eleitos em 2026</dt><dd>${st.sen_2026_1 || "N/D"} e ${st.sen_2026_2 || "N/D"}</dd></div>
              <div><dt>3º Senador (${m.uf}, 2022 a 2031)</dt><dd>${st.sen_2022 || "N/D"}</dd></div>
              <div><dt>Presidente Eleito 2026 (UF)</dt><dd>${st.pres26_winner || "N/D"} (Lula ${C.fmtDec(st.pres26_lula_pct, 1)}% × Flávio ${C.fmtDec(st.pres26_flavio_pct, 1)}%)</dd></div>
            </dl>
          </div>
        </div>
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--color-rule)">
          <div class="mono" style="color:var(--wnba-tan-dark);margin-bottom:8px">5 MUNICÍPIOS MAIS PRÓXIMOS GEOGRAFICAMENTE (CLIQUE PARA EXPLORAR):</div>
          <div class="viz-toolbar">
            ${neighbors.map((nb) => `<button type="button" class="chip-btn" data-jump-mun="${nb.name}|${nb.uf}">${nb.name} (${nb.uf}) · ${nb.dist_km} km · ${C.fmtInt(nb.pop2024)} hab.</button>`).join("")}
          </div>
        </div>
      `;

      fichaBox.querySelectorAll("[data-jump-mun]").forEach((btn) => btn.addEventListener("click", () => renderFicha(btn.getAttribute("data-jump-mun"), true)));
      if (flyMap && window.DSFlyToMunicipio) window.DSFlyToMunicipio(m);
    }

    window.DSSelectMunicipio = renderFicha;
    renderFicha("São Paulo|SP", false);

    bindCityAutocomplete(document.getElementById("explorer-search-input"), document.getElementById("explorer-autocomplete"), (id) => renderFicha(id, true));
    document.querySelectorAll("[data-quick-mun]").forEach((btn) => btn.addEventListener("click", () => renderFicha(btn.getAttribute("data-quick-mun"), true)));

    // Comparador Livre de Quaisquer 2 dos 5.571 Municípios
    let compIdA = "São Paulo|SP";
    let compIdB = "Serra da Saudade|MG";
    const compInputA = document.getElementById("comp-input-a");
    const compInputB = document.getElementById("comp-input-b");
    const compBox = document.getElementById("comparator-output");

    function renderComparator() {
      if (!compBox) return;
      const a = data.municipios.find((x) => x.id === compIdA) || data.municipios[0];
      const b = data.municipios.find((x) => x.id === compIdB) || data.municipios[data.municipios.length - 1];
      const stA = data.states.find((s) => s.uf === a.uf) || data.states[0];
      const stB = data.states.find((s) => s.uf === b.uf) || data.states[0];
      const ratio = (Math.max(a.pop2024, b.pop2024) / Math.max(1, Math.min(a.pop2024, b.pop2024))).toFixed(1);
      const dist = haversine(a.lat, a.lng, b.lat, b.lng);

      compBox.innerHTML = `
        <div class="chart-fact-banner" style="margin-bottom:14px">
          <div>
            <span class="fact-badge">COMPARAÇÃO DIRETA</span>
            <strong>${a.name} (${a.uf}) vs. ${b.name} (${b.uf}): diferença de ${C.fmtInt(ratio)}× na população</strong>
          </div>
          <span class="mono" style="color:var(--wnba-tan-dark)">DISTÂNCIA EM LINHA RETA: ${C.fmtInt(Math.round(dist))} KM</span>
        </div>
        <div class="grid-2">
          <div style="padding:16px;border:1.5px solid var(--wnba-red);border-radius:5px;background:var(--color-paper)">
            <div class="mono" style="color:var(--wnba-red)">MUNICÍPIO A · #${C.fmtInt(a.rank_national)} NO BRASIL · ${a.region}</div>
            <h4 style="font:700 22px var(--font-display);margin:4px 0 8px">${a.name} (${a.uf})</h4>
            <dl class="spec">
              <div><dt>População 2024 (IBGE)</dt><dd>${C.fmtInt(a.pop2024)} hab. (${C.fmtDec(a.pct_br, 3)}% BR)</dd></div>
              <div><dt>Censo 2022 e Variação</dt><dd>${C.fmtInt(a.pop2022)} (${a.growth_22_24 >= 0 ? "+" : ""}${C.fmtDec(a.growth_22_24, 2)}%)</dd></div>
              <div><dt>Área e Densidade</dt><dd>${C.fmtDec(a.area, 1)} km² · ${C.fmtDec(a.density, 1)} hab/km²</dd></div>
              <div><dt>Prefeitura TSE 2024</dt><dd>${a.mayor_2024} (${a.party_2024} · ${C.fmtDec(a.vote_pct_2024, 1)}%)</dd></div>
              <div><dt>Comparecimento / Vereadoras</dt><dd>${C.fmtDec(a.turnout_2024, 1)}% · ${C.fmtDec(a.women_council_pct, 1)}% mulheres</dd></div>
              <div><dt>Governador Atual (2026)</dt><dd>${stA.gov_current || "N/D"}</dd></div>
              <div><dt>Governador Eleito em 2026</dt><dd><b>${stA.gov_elected_2026 || "N/D"} (${stA.gov_party_2026})</b> · ${stA.gov_turn_2026}</dd></div>
              <div><dt>Senadores Eleitos em 2026</dt><dd>${stA.sen_2026_1} e ${stA.sen_2026_2}</dd></div>
              <div><dt>3º Senador (${a.uf})</dt><dd>${stA.sen_2022}</dd></div>
              <div><dt>Presidente 2026 (2ºT em ${a.uf})</dt><dd>Lula ${C.fmtDec(stA.pres26_lula_pct, 1)}% × Flávio Bolsonaro ${C.fmtDec(stA.pres26_flavio_pct, 1)}%</dd></div>
            </dl>
          </div>
          <div style="padding:16px;border:1.5px solid var(--wnba-navy);border-radius:5px;background:var(--color-paper)">
            <div class="mono" style="color:var(--wnba-navy)">MUNICÍPIO B · #${C.fmtInt(b.rank_national)} NO BRASIL · ${b.region}</div>
            <h4 style="font:700 22px var(--font-display);margin:4px 0 8px">${b.name} (${b.uf})</h4>
            <dl class="spec">
              <div><dt>População 2024 (IBGE)</dt><dd>${C.fmtInt(b.pop2024)} hab. (${C.fmtDec(b.pct_br, 3)}% BR)</dd></div>
              <div><dt>Censo 2022 e Variação</dt><dd>${C.fmtInt(b.pop2022)} (${b.growth_22_24 >= 0 ? "+" : ""}${C.fmtDec(b.growth_22_24, 2)}%)</dd></div>
              <div><dt>Área e Densidade</dt><dd>${C.fmtDec(b.area, 1)} km² · ${C.fmtDec(b.density, 1)} hab/km²</dd></div>
              <div><dt>Prefeitura TSE 2024</dt><dd>${b.mayor_2024} (${b.party_2024} · ${C.fmtDec(b.vote_pct_2024, 1)}%)</dd></div>
              <div><dt>Comparecimento / Vereadoras</dt><dd>${C.fmtDec(b.turnout_2024, 1)}% · ${C.fmtDec(b.women_council_pct, 1)}% mulheres</dd></div>
              <div><dt>Governador Atual (2026)</dt><dd>${stB.gov_current || "N/D"}</dd></div>
              <div><dt>Governador Eleito em 2026</dt><dd><b>${stB.gov_elected_2026 || "N/D"} (${stB.gov_party_2026})</b> · ${stB.gov_turn_2026}</dd></div>
              <div><dt>Senadores Eleitos em 2026</dt><dd>${stB.sen_2026_1} e ${stB.sen_2026_2}</dd></div>
              <div><dt>3º Senador (${b.uf})</dt><dd>${stB.sen_2022}</dd></div>
              <div><dt>Presidente 2026 (2ºT em ${b.uf})</dt><dd>Lula ${C.fmtDec(stB.pres26_lula_pct, 1)}% × Flávio Bolsonaro ${C.fmtDec(stB.pres26_flavio_pct, 1)}%</dd></div>
            </dl>
          </div>
        </div>
      `;
    }

    bindCityAutocomplete(compInputA, document.getElementById("comp-auto-a"), (id) => { compIdA = id; renderComparator(); });
    bindCityAutocomplete(compInputB, document.getElementById("comp-auto-b"), (id) => { compIdB = id; renderComparator(); });

    document.querySelectorAll("[data-quick-comp]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [idA, idB] = btn.getAttribute("data-quick-comp").split("||");
        compIdA = idA;
        compIdB = idB;
        const a = data.municipios.find((x) => x.id === idA);
        const b = data.municipios.find((x) => x.id === idB);
        if (a && compInputA) compInputA.value = `${a.name} (${a.uf})`;
        if (b && compInputB) compInputB.value = `${b.name} (${b.uf})`;
        renderComparator();
      });
    });

    renderComparator();
  });
})();
