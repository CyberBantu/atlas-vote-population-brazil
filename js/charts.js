/* ==========================================================================
   ATLAS DO VOTO E DA POPULAÇÃO (BRASIL 2024 A 2026)
   Visualizações: Three.js (Globo 3D com Mapa-Múndi e América Latina),
   D3.js (Série Histórica, Mapa UF, Rankings, Treemap, Escada do Poder, Fiscal)
   e Leaflet 100% Vetorial (Todos os 5.571 municípios IBGE sem API Key)
   ========================================================================== */

(function () {
  "use strict";

  const fmtInt = (n) => Number(n || 0).toLocaleString("pt-BR");
  const fmtDec = (n, d = 1) => Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

  const REGION_COLORS = {
    "Sudeste": "#b91c1c",
    "Nordeste": "#fa4d00",
    "Sul": "#2a78d6",
    "Norte": "#166534",
    "Centro-Oeste": "#6b1d91"
  };

  const PARTY_COLORS = {
    "PSD": "#2a78d6",
    "MDB": "#166534",
    "PP": "#17a2b8",
    "UNIÃO": "#e0851f",
    "PL": "#103a63",
    "REPUBLICANOS": "#6b4bb0",
    "PSB": "#fa4d00",
    "PSDB": "#5b9bd5",
    "PT": "#b91c1c",
    "PDT": "#8a6d3b",
    "PODEMOS": "#6b1d91",
    "AVANTE": "#d55181",
    "SOLIDARIEDADE": "#d55181",
    "NOVO": "#f26f21"
  };

  function showTip(ev, html) {
    const tip = document.getElementById("d3-tooltip");
    if (!tip) return;
    tip.innerHTML = html;
    tip.style.opacity = "1";
    moveTip(ev);
  }
  function moveTip(ev) {
    const tip = document.getElementById("d3-tooltip");
    if (!tip) return;
    const pad = 14;
    let x = ev.clientX + pad;
    let y = ev.clientY + pad;
    const rect = tip.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 10) x = ev.clientX - rect.width - pad;
    if (y + rect.height > window.innerHeight - 10) y = ev.clientY - rect.height - pad;
    tip.style.left = Math.max(8, x) + "px";
    tip.style.top = Math.max(8, y) + "px";
  }
  function hideTip() {
    const tip = document.getElementById("d3-tooltip");
    if (tip) tip.style.opacity = "0";
  }

  function setFactBanner(bannerId, badgeText, headlineText, sourceText) {
    const el = document.getElementById(bannerId);
    if (!el) return;
    el.innerHTML = `
      <div>
        <span class="fact-badge">${badgeText}</span>
        <strong>${headlineText}</strong>
      </div>
      <span class="mono" style="color:var(--wnba-tan-dark)">${sourceText}</span>
    `;
  }

  // 1. THREE.JS GLOBE 3D COM MAPA-MÚNDI, AMÉRICA LATINA E 27 UFs DO BRASIL
  function initHeroGlobe(data) {
    const wrap = document.getElementById("globe-canvas-wrap");
    if (!wrap || typeof THREE === "undefined") return;

    function latLngToVec3(lat, lng, radius) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }

    function createWorldMapTexture() {
      const c = document.createElement("canvas");
      c.width = 2048;
      c.height = 1024;
      const ctx = c.getContext("2d");

      ctx.fillStyle = "#19222b";
      ctx.fillRect(0, 0, c.width, c.height);

      ctx.strokeStyle = "rgba(230, 220, 195, 0.14)";
      ctx.lineWidth = 1;
      for (let lng = -180; lng <= 180; lng += 15) {
        const x = ((lng + 180) / 360) * c.width;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke();
      }
      for (let lat = -75; lat <= 75; lat += 15) {
        const y = ((90 - lat) / 180) * c.height;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke();
      }

      const toXY = (lng, lat) => [((lng + 180) / 360) * c.width, ((90 - lat) / 180) * c.height];

      const continents = (data.geo && data.geo.world_continents) || [];
      continents.forEach((cont) => {
        ctx.beginPath();
        cont.coords.forEach(([lng, lat], i) => {
          const [x, y] = toXY(lng, lat);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = cont.role === "latam" ? "#3b352c" : "#262d34";
        ctx.fill();
        ctx.strokeStyle = cont.role === "latam" ? "#d8cdb6" : "rgba(216, 205, 182, 0.42)";
        ctx.lineWidth = cont.role === "latam" ? 2.4 : 1.4;
        ctx.stroke();
      });

      data.states.forEach((st) => {
        if (!st.polygon) return;
        ctx.beginPath();
        st.polygon.forEach(([lng, lat], i) => {
          const [x, y] = toXY(lng, lat);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = REGION_COLORS[st.region] || "#b91c1c";
        ctx.globalAlpha = 0.65;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = "#fffdf8";
        ctx.lineWidth = 1.8;
        ctx.stroke();
      });

      return new THREE.CanvasTexture(c);
    }

    try {
      const w = wrap.clientWidth || 580;
      const h = wrap.clientHeight || 520;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 1000);
      camera.position.set(0, 0, 215);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      wrap.innerHTML = "";
      wrap.appendChild(renderer.domElement);

      const globeGroup = new THREE.Group();
      scene.add(globeGroup);

      const R = 78;
      const worldTexture = createWorldMapTexture();
      globeGroup.add(new THREE.Mesh(
        new THREE.SphereGeometry(R, 56, 56),
        new THREE.MeshPhongMaterial({ map: worldTexture, specular: 0x222222, shininess: 10 })
      ));

      const continents = (data.geo && data.geo.world_continents) || [];
      continents.forEach((cont) => {
        const pts = cont.coords.map(([lng, lat]) => latLngToVec3(lat, lng, R + 0.45));
        globeGroup.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: cont.role === "latam" ? 0xf5ecd8 : 0x6e7b85, transparent: true, opacity: cont.role === "latam" ? 0.9 : 0.45 })
        ));
      });

      data.states.forEach((st) => {
        if (st.polygon) {
          const uPts = st.polygon.map(([lng, lat]) => latLngToVec3(lat, lng, R + 0.7));
          globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(uPts), new THREE.LineBasicMaterial({ color: 0xffe6a3, transparent: true, opacity: 0.75 })));
        }
        const barH = Math.max(3.5, Math.sqrt(st.pop2024 / 1000000) * 5.8);
        const pos = latLngToVec3(st.lat, st.lng, R + barH / 2);
        const colHex = parseInt((REGION_COLORS[st.region] || "#b91c1c").replace("#", "0x"), 16);
        const cylGeo = new THREE.CylinderGeometry(1.15, 1.15, barH, 10);
        cylGeo.rotateX(Math.PI / 2);
        const mesh = new THREE.Mesh(cylGeo, new THREE.MeshPhongMaterial({ color: colHex, emissive: colHex, emissiveIntensity: 0.35 }));
        mesh.position.copy(pos);
        mesh.lookAt(0, 0, 0);
        globeGroup.add(mesh);
      });

      scene.add(new THREE.AmbientLight(0xffffff, 0.88));
      const dir = new THREE.DirectionalLight(0xfff6e5, 0.95);
      dir.position.set(140, 110, 180);
      scene.add(dir);

      globeGroup.rotation.y = -0.68;
      globeGroup.rotation.x = -0.22;
      let autoSpin = true;
      let isZoomBrazil = false;

      let dragging = false, px = 0, py = 0;
      renderer.domElement.addEventListener("pointerdown", (e) => { dragging = true; px = e.clientX; py = e.clientY; });
      window.addEventListener("pointerup", () => { dragging = false; });
      window.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        globeGroup.rotation.y += (e.clientX - px) * 0.006;
        globeGroup.rotation.x = Math.max(-1.1, Math.min(1.1, globeGroup.rotation.x + (e.clientY - py) * 0.006));
        px = e.clientX; py = e.clientY;
      });

      const btnFocus = document.getElementById("btn-globe-focus");
      const btnSpin = document.getElementById("btn-globe-spin");
      if (btnFocus) {
        btnFocus.addEventListener("click", () => {
          isZoomBrazil = !isZoomBrazil;
          if (isZoomBrazil) {
            autoSpin = false;
            if (btnSpin) { btnSpin.classList.remove("active"); btnSpin.textContent = "Girar Mapa-Múndi"; }
          }
          btnFocus.classList.toggle("active", isZoomBrazil);
          btnFocus.textContent = isZoomBrazil ? "Visão: América Latina e Mundo" : "Focar no Brasil (27 UFs)";
        });
      }
      if (btnSpin) {
        btnSpin.addEventListener("click", () => {
          autoSpin = !autoSpin;
          if (autoSpin) isZoomBrazil = false;
          btnSpin.classList.toggle("active", autoSpin);
          btnSpin.textContent = autoSpin ? "Pausar Giro" : "Girar Mapa-Múndi";
        });
      }

      function animate() {
        requestAnimationFrame(animate);
        if (autoSpin && !dragging) {
          globeGroup.rotation.y += 0.0022;
        } else if (!dragging && isZoomBrazil) {
          globeGroup.rotation.y += (-0.68 - globeGroup.rotation.y) * 0.06;
          globeGroup.rotation.x += (-0.24 - globeGroup.rotation.x) * 0.06;
        }
        const targetZ = isZoomBrazil ? 168 : 215;
        camera.position.z += (targetZ - camera.position.z) * 0.06;
        renderer.render(scene, camera);
      }
      animate();
    } catch (e) {
      wrap.innerHTML = `<div class="mono" style="padding:24px;text-align:center">Mapa-Múndi e América Latina · 212,6 Milhões de Brasileiros</div>`;
    }
  }

  window.DSCharts = {
    fmtInt,
    fmtDec,
    REGION_COLORS,
    PARTY_COLORS,
    showTip,
    moveTip,
    hideTip,
    setFactBanner,
    initHeroGlobe
  };
})();

(function () {
  "use strict";
  const C = window.DSCharts;

  function drawSvgFactMarkers(svg, markers, bannerId) {
    const g = svg.selectAll("g.fact-marker").data(markers).enter().append("g")
      .attr("class", "fact-marker")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .on("mouseenter", (ev, d) => {
        C.setFactBanner(bannerId, d.badge, d.headline, d.source);
        C.showTip(ev, `<div class="tt-kicker">${d.badge} · ${d.source}</div><div class="tt-title">${d.headline}</div><div>${d.detail}</div>`);
      })
      .on("mousemove", C.moveTip)
      .on("mouseleave", C.hideTip)
      .on("click", (ev, d) => { C.setFactBanner(bannerId, d.badge, d.headline, d.source); });

    g.append("line")
      .attr("x1", 0).attr("y1", 0).attr("x2", (d) => d.dx || 0).attr("y2", (d) => d.dy || 22)
      .attr("stroke", "#b91c1c").attr("stroke-width", 1.5).attr("stroke-dasharray", "3,2");
    g.append("circle").attr("class", "pin-bg").attr("r", 11).attr("fill", "#b91c1c").attr("stroke", "#fffdf8").attr("stroke-width", 2);
    g.append("text").attr("text-anchor", "middle").attr("dy", "0.36em").attr("font-family", "Atlas Grotesk, Archivo, sans-serif").attr("font-size", 11).attr("font-weight", 800).attr("fill", "#ffffff").text((d) => d.num);
  }

  // 2. SÉRIE HISTÓRICA IBGE (1970 A 2024) COM MARCADORES DE FATOS
  C.renderHistoricalCharts = function (data, highlightStep = "2024") {
    const histEl = document.getElementById("d3-hist-line");
    if (!histEl || typeof d3 === "undefined") return;
    histEl.innerHTML = "";

    const series = [
      { year: 1970, pop: 93139037, tag: "Censo 1970: Brasil cruza 93 milhões e inicia urbanização acelerada" },
      { year: 1980, pop: 119002706, tag: "Censo 1980: auge do êxodo rural (+2,48% ao ano)" },
      { year: 1991, pop: 146825475, tag: "Censo 1991: início da queda estrutural da fecundidade" },
      { year: 2000, pop: 169799170, tag: "Censo 2000: crescimento das cidades médias do interior" },
      { year: 2010, pop: 190755799, tag: "Censo 2010: 190,7 milhões; taxa cai para 1,17% a.a." },
      { year: 2022, pop: 203080756, tag: "Censo 2022: 203,08 milhões (+0,52% a.a., menor taxa desde 1872)" },
      { year: 2024, pop: 212583750, tag: "Estimativa 2024: 212,58 milhões após recalibração pós-Censo (DOU 29/08/2024)" }
    ];

    const w = histEl.clientWidth || 640, h = 340;
    const m = { top: 38, right: 36, bottom: 40, left: 60 };
    const svg = d3.select(histEl).append("svg").attr("viewBox", `0 0 ${w} ${h}`);
    const x = d3.scaleLinear().domain([1970, 2025]).range([m.left, w - m.right]);
    const y = d3.scaleLinear().domain([80000000, 232000000]).range([h - m.bottom, m.top]);

    svg.append("g").attr("transform", `translate(0,${h - m.bottom})`).call(d3.axisBottom(x).tickValues([1970, 1980, 1991, 2000, 2010, 2022, 2024]).tickFormat(d3.format("d"))).attr("font-family", "JetBrains Mono, monospace").attr("font-size", 11);
    svg.append("g").attr("transform", `translate(${m.left},0)`).call(d3.axisLeft(y).ticks(5).tickFormat((d) => (d / 1e6).toFixed(0) + "M")).attr("font-family", "JetBrains Mono, monospace").attr("font-size", 11);

    svg.append("path").datum(series).attr("fill", "rgba(185, 28, 28, 0.12)").attr("d", d3.area().x((d) => x(d.year)).y0(h - m.bottom).y1((d) => y(d.pop)).curve(d3.curveMonotoneX));
    svg.append("path").datum(series).attr("fill", "none").attr("stroke", "#b91c1c").attr("stroke-width", 3).attr("d", d3.line().x((d) => x(d.year)).y((d) => y(d.pop)).curve(d3.curveMonotoneX));

    svg.selectAll("circle.pt").data(series).enter().append("circle")
      .attr("cx", (d) => x(d.year)).attr("cy", (d) => y(d.pop))
      .attr("r", (d) => (highlightStep === String(d.year) ? 8 : 5))
      .attr("fill", (d) => (highlightStep === String(d.year) ? "#fa4d00" : "#b91c1c"))
      .attr("stroke", "#fffdf8").attr("stroke-width", 2).style("cursor", "pointer")
      .on("mouseenter", (ev, d) => C.showTip(ev, `<div class="tt-kicker">IBGE · SÉRIE HISTÓRICA</div><div class="tt-title">${d.year}: ${C.fmtInt(d.pop)} hab.</div><div>${d.tag}</div>`))
      .on("mousemove", C.moveTip).on("mouseleave", C.hideTip);

    drawSvgFactMarkers(svg, [
      { num: "1", x: x(1980), y: y(119002706) - 28, dx: 0, dy: 28, badge: "FATO ① · CENSO 1980", headline: "Êxodo rural: população urbana supera 67% do país", source: "IBGE Censo", detail: "O Brasil crescia 2,48% ao ano, puxado pela industrialização do Sudeste." },
      { num: "2", x: x(2010), y: y(190755799) - 28, dx: 0, dy: 28, badge: "FATO ② · CENSO 2010", headline: "Fecundidade cai para 1,9 filho por mulher (abaixo da reposição)", source: "IBGE", detail: "A desaceleração demográfica se espalha por todas as cinco regiões." },
      { num: "3", x: x(2022) - 14, y: y(203080756) - 32, dx: 14, dy: 32, badge: "NOTÍCIA ③ · JUN 2023", headline: "Censo 2022 revela 203,08 milhões (+0,52% a.a.) e queda em 5 capitais", source: "G1 / Folha / IBGE", detail: "Salvador, BH, Belém, Porto Alegre e Natal registraram perda populacional para cidades vizinhas." },
      { num: "4", x: x(2024) - 6, y: y(212583750) - 26, dx: 6, dy: 26, badge: "NOTÍCIA ④ · 29 AGO 2024", headline: "IBGE publica estimativa de 212.583.750 habitantes para cálculo do FPM", source: "DOU / Agência Brasil", detail: "58,5% da população mora em apenas 320 cidades acima de 100 mil habitantes." }
    ], "fact-banner-panorama");
  };

  // 3.1 MAPA DE ESTADOS COM CONTORNO DA AMÉRICA DO SUL + RANKING 27 UFs
  C.renderStatesMapAndRank = function (data, metric = "pop2024") {
    const mapEl = document.getElementById("d3-states-map");
    const rankEl = document.getElementById("d3-states-rank");
    if (!mapEl || typeof d3 === "undefined") return;

    mapEl.innerHTML = "";
    const w = mapEl.clientWidth || 440, h = 440;
    const svg = d3.select(mapEl).append("svg").attr("viewBox", `0 0 ${w} ${h}`);
    const xProj = d3.scaleLinear().domain([-75.0, -33.5]).range([24, w - 24]);
    const yProj = d3.scaleLinear().domain([6.0, -34.5]).range([24, h - 24]);

    const sa = ((data.geo && data.geo.world_continents) || []).find((c) => c.name === "América do Sul");
    if (sa) {
      svg.append("path").datum(sa.coords)
        .attr("d", d3.line().x((d) => xProj(d[0])).y((d) => yProj(d[1])).curve(d3.curveLinearClosed))
        .attr("fill", "rgba(216, 205, 182, 0.25)").attr("stroke", "#c9bba0").attr("stroke-width", 1.5).attr("stroke-dasharray", "4,3");
    }

    const colorScale = metric === "top_party"
      ? (s) => C.PARTY_COLORS[s.top_party] || "#b91c1c"
      : metric === "density"
        ? d3.scaleSequentialLog(d3.interpolateYlOrRd).domain([2.5, 520])
        : metric === "growth_10_24"
          ? d3.scaleSequential(d3.interpolateRdYlGn).domain([0, 60])
          : d3.scaleSequentialLog(d3.interpolateOrRd).domain([650000, 46000000]);

    const polyLine = d3.line().x((d) => xProj(d[0])).y((d) => yProj(d[1])).curve(d3.curveLinearClosed);
    svg.selectAll("path.uf-poly").data(data.states).enter().append("path")
      .attr("d", (d) => d.polygon ? polyLine(d.polygon) : "")
      .attr("fill", (d) => metric === "top_party" ? colorScale(d) : colorScale(d[metric]))
      .attr("fill-opacity", 0.22).attr("stroke", "#bfa98a").attr("stroke-width", 1);

    const nodes = data.states.map((s) => ({
      ...s, cx: xProj(s.lng), cy: yProj(s.lat),
      r: metric === "density" ? Math.max(13, Math.min(32, Math.sqrt(s.density) * 1.5)) : Math.max(13, Math.min(36, Math.sqrt(s.pop2024 / 1000000) * 5.3))
    }));

    const g = svg.selectAll("g.uf-node").data(nodes).enter().append("g")
      .attr("transform", (d) => `translate(${d.cx},${d.cy})`).style("cursor", "pointer")
      .on("mouseenter", (ev, d) => C.showTip(ev, `
        <div class="tt-kicker">${d.region} · #${d.rank} NO BRASIL</div>
        <div class="tt-title">${d.name} (${d.uf})</div>
        <div><b>População 2024:</b> ${C.fmtInt(d.pop2024)} (${C.fmtDec(d.pct_br, 2)}%)</div>
        <div><b>Densidade:</b> ${C.fmtDec(d.density, 2)} hab/km² · <b>Municípios:</b> ${d.mun_count}</div>
        <div><b>Governador Atual (2026):</b> ${d.gov_current || "N/D"}</div>
        <div><b>Governador Eleito 2026:</b> ${d.gov_elected_2026 || "N/D"} (${d.gov_party_2026 || "N/D"} · ${d.gov_turn_2026 || ""})</div>
        <div><b>Senadores Eleitos 2026:</b> ${d.sen_2026_1 || "N/D"} e ${d.sen_2026_2 || "N/D"}</div>
        <div><b>Prefeituras 2024:</b> Partido líder ${d.top_party}</div>
      `))
      .on("mousemove", C.moveTip).on("mouseleave", C.hideTip)
      .on("click", (ev, d) => {
        const selUf = document.getElementById("filter-mun-uf");
        if (selUf) { selUf.value = d.uf; selUf.dispatchEvent(new Event("change")); }
      });

    g.append("circle").attr("r", (d) => d.r).attr("fill", (d) => metric === "top_party" ? colorScale(d) : colorScale(d[metric])).attr("stroke", "#2a1503").attr("stroke-width", 1.5);
    g.append("text").attr("text-anchor", "middle").attr("dy", "0.34em").attr("font-family", "Atlas Grotesk, Archivo, sans-serif").attr("font-weight", 800).attr("font-size", (d) => d.r > 18 ? 11 : 9.5).attr("fill", (d) => (metric === "pop2024" && d.pop2024 < 3500000) ? "#2a1503" : "#fffdf8").text((d) => d.uf);

    if (rankEl) {
      rankEl.innerHTML = "";
      const sorted = [...data.states].sort((a, b) => (metric === "density" ? b.density - a.density : metric === "growth_10_24" ? b.growth_10_24 - a.growth_10_24 : b.pop2024 - a.pop2024));
      const rw = rankEl.clientWidth || 360, rh = 440;
      const rm = { top: 8, right: 68, bottom: 16, left: 34 };
      const rsvg = d3.select(rankEl).append("svg").attr("viewBox", `0 0 ${rw} ${rh}`);
      const ry = d3.scaleBand().domain(sorted.map((d) => d.uf)).range([rm.top, rh - rm.bottom]).padding(0.18);
      const maxVal = d3.max(sorted, (d) => metric === "density" ? d.density : metric === "growth_10_24" ? d.growth_10_24 : d.pop2024) || 1;
      const rx = d3.scaleLinear().domain([0, maxVal]).range([rm.left, rw - rm.right]);

      rsvg.append("g").attr("transform", `translate(${rm.left},0)`).call(d3.axisLeft(ry).tickSize(0)).attr("font-family", "JetBrains Mono, monospace").attr("font-size", 9.5);
      rsvg.selectAll("rect").data(sorted).enter().append("rect").attr("x", rm.left + 2).attr("y", (d) => ry(d.uf)).attr("height", ry.bandwidth()).attr("width", (d) => Math.max(3, rx(metric === "density" ? d.density : metric === "growth_10_24" ? d.growth_10_24 : d.pop2024) - rm.left)).attr("fill", (d) => C.REGION_COLORS[d.region] || "#b91c1c");
      rsvg.selectAll("text.v").data(sorted).enter().append("text").attr("x", (d) => rx(metric === "density" ? d.density : metric === "growth_10_24" ? d.growth_10_24 : d.pop2024) + 5).attr("y", (d) => ry(d.uf) + ry.bandwidth() - 2).attr("font-family", "JetBrains Mono, monospace").attr("font-size", 9).attr("fill", "currentColor").text((d) => metric === "density" ? C.fmtDec(d.density, 0) + " h/km²" : metric === "growth_10_24" ? "+" + C.fmtDec(d.growth_10_24, 0) + "%" : C.fmtDec(d.pop2024 / 1e6, 1) + "M");
    }
  };

  // 3.2 MAPA VETORIAL DE TODOS OS 5.571 MUNICÍPIOS (LEAFLET CANVAS, SEM API KEY)
  C.initMunicipalLeafletMap = function (data) {
    const mapDiv = document.getElementById("leaflet-mun-map");
    if (!mapDiv || typeof L === "undefined") return;

    const map = L.map("leaflet-mun-map", {
      center: [-14.5, -52.5], zoom: 4, minZoom: 3, maxZoom: 11,
      scrollWheelZoom: false, preferCanvas: true, attributionControl: true
    });
    const canvasRenderer = L.canvas({ padding: 0.4 });
    const baseVectorGroup = L.layerGroup().addTo(map);

    for (let lat = -50; lat <= 15; lat += 10) L.polyline([[lat, -90], [lat, -25]], { color: "#d8cdb6", weight: 0.7, dashArray: "3,4", interactive: false }).addTo(baseVectorGroup);
    for (let lng = -80; lng <= -30; lng += 10) L.polyline([[-55, lng], [15, lng]], { color: "#d8cdb6", weight: 0.7, dashArray: "3,4", interactive: false }).addTo(baseVectorGroup);

    const continents = (data.geo && data.geo.world_continents) || [];
    continents.filter((c) => c.role === "latam").forEach((cont) => {
      L.polygon(cont.coords.map(([lng, lat]) => [lat, lng]), { color: "#b8a88a", weight: 1.5, fillColor: "#efe5cf", fillOpacity: 0.65, interactive: false }).addTo(baseVectorGroup);
    });

    const ufPolyLayer = L.layerGroup().addTo(map);
    data.states.forEach((st) => {
      if (!st.polygon) return;
      const poly = L.polygon(st.polygon.map(([lng, lat]) => [lat, lng]), {
        color: "#8c7a5b", weight: 1.3, fillColor: C.REGION_COLORS[st.region] || "#b91c1c", fillOpacity: 0.14
      });
      poly.bindTooltip(`<b>${st.name} (${st.uf})</b> · ${C.fmtInt(st.pop2024)} hab.`, { sticky: true });
      poly.on("click", () => {
        const selUf = document.getElementById("filter-mun-uf");
        if (selUf) { selUf.value = st.uf; selUf.dispatchEvent(new Event("change")); }
      });
      poly.addTo(ufPolyLayer);
    });

    const markerGroup = L.layerGroup().addTo(map);
    let currentMode = "pop2024";

    function getMarkerColor(m) {
      if (currentMode === "party_2024") return C.PARTY_COLORS[m.party_2024] || "#b91c1c";
      if (currentMode === "density") return m.density > 2500 ? "#7f0000" : m.density > 600 ? "#b91c1c" : m.density > 80 ? "#fa4d00" : "#d97706";
      if (currentMode === "growth_22_24") return m.growth_22_24 < 0 ? "#2a78d6" : m.growth_22_24 > 6 ? "#166534" : "#fa4d00";
      return C.REGION_COLORS[m.region] || "#b91c1c";
    }

    function renderMarkers() {
      markerGroup.clearLayers();
      const ufVal = (document.getElementById("filter-mun-uf") || {}).value || "ALL";
      const regVal = (document.getElementById("filter-mun-region") || {}).value || "ALL";
      const brkVal = (document.getElementById("filter-mun-bracket") || {}).value || "ALL";

      let filtered = data.municipios.filter((m) => {
        if (ufVal !== "ALL" && m.uf !== ufVal) return false;
        if (regVal !== "ALL" && m.region !== regVal) return false;
        if (brkVal !== "ALL" && m.bracket !== brkVal) return false;
        return true;
      });

      let fallbackUsed = false;
      if (filtered.length === 0 && ufVal !== "ALL") {
        filtered = data.municipios.filter((m) => m.uf === ufVal);
        fallbackUsed = true;
      }

      filtered.forEach((m) => {
        const circle = L.circleMarker([m.lat, m.lng], {
          renderer: canvasRenderer,
          radius: filtered.length > 600 ? Math.max(2.6, Math.min(18, Math.sqrt(m.pop2024 / 18000) * 0.9)) : Math.max(5.2, Math.min(24, Math.sqrt(m.pop2024 / 10000) * 1.1)),
          fillColor: getMarkerColor(m),
          color: "#2a1503",
          weight: m.is_capital ? 2 : (filtered.length > 600 ? 0.4 : 1.1),
          opacity: 0.9,
          fillOpacity: filtered.length > 600 ? 0.72 : 0.88
        });
        circle.bindPopup(`
          <div style="font-family:'Atlas Grotesk',Archivo,sans-serif;min-width:225px;color:#1a1a1a">
            <div style="font:700 10px monospace;color:#b91c1c;letter-spacing:.08em;text-transform:uppercase">${m.region} · #${m.rank_national} BRASIL · FAIXA ${m.bracket}</div>
            <div style="font:700 18px Georgia,serif;margin:3px 0 6px">${m.name} (${m.uf}) ${m.is_capital ? "★ Capital" : ""}</div>
            <div style="font-size:12.5px;line-height:1.48">
              <b>População 2024 (IBGE):</b> ${C.fmtInt(m.pop2024)} hab.<br>
              <b>Censo 2022:</b> ${C.fmtInt(m.pop2022)} (${m.growth_22_24 >= 0 ? "+" : ""}${C.fmtDec(m.growth_22_24, 2)}%)<br>
              <b>Densidade:</b> ${C.fmtDec(m.density, 1)} hab/km² · <b>Área:</b> ${C.fmtDec(m.area, 1)} km²<br>
              <hr style="border:0;border-top:1px solid #e6dcc3;margin:6px 0">
              <b>Prefeito(a) 2024:</b> ${m.mayor_2024} (<b>${m.party_2024}</b> · ${C.fmtDec(m.vote_pct_2024, 1)}%)
            </div>
          </div>
        `);
        circle.on("click", () => { if (window.DSSelectMunicipio) window.DSSelectMunicipio(m.id, false); });
        markerGroup.addLayer(circle);
      });

      const countBadge = document.getElementById("mun-map-count");
      if (countBadge) {
        countBadge.textContent = fallbackUsed
          ? `Exibindo todos os ${C.fmtInt(filtered.length)} municípios de ${ufVal} (faixa ajustada)`
          : `${C.fmtInt(filtered.length)} municípios exibidos (base completa IBGE: ${C.fmtInt(data.municipios.length)})`;
      }
      if (ufVal !== "ALL" && filtered.length > 0) map.setView([filtered[0].lat, filtered[0].lng], 6);
      else if (regVal === "ALL" && ufVal === "ALL") map.setView([-14.5, -52.5], 4);
    }

    renderMarkers();
    ["filter-mun-uf", "filter-mun-region", "filter-mun-bracket"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("change", renderMarkers);
    });
    document.querySelectorAll("[data-mun-map-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-mun-map-mode]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentMode = btn.getAttribute("data-mun-map-mode");
        renderMarkers();
      });
    });
    window.DSFlyToMunicipio = function (m) { if (m) map.setView([m.lat, m.lng], 7); };
  };
})();

(function () {
  "use strict";
  const C = window.DSCharts;

  C.renderRankingsSection = function (data, mode = "top50") {
    const chartEl = document.getElementById("d3-main-ranking");
    if (!chartEl || typeof d3 === "undefined") return;
    chartEl.innerHTML = "";

    let items = [];
    if (mode === "top50") items = [...data.municipios].sort((a, b) => b.pop2024 - a.pop2024).slice(0, 50);
    else if (mode === "smallest30") items = [...data.municipios].sort((a, b) => a.pop2024 - b.pop2024).slice(0, 30);
    else if (mode === "capitals27") items = data.municipios.filter((m) => m.is_capital).sort((a, b) => b.pop2024 - a.pop2024);
    else if (mode === "noncapitals30") items = data.municipios.filter((m) => !m.is_capital).sort((a, b) => b.pop2024 - a.pop2024).slice(0, 30);

    const rowH = 21, w = chartEl.clientWidth || 720, h = items.length * rowH + 40;
    const m = { top: 14, right: 130, bottom: 20, left: 190 };
    const svg = d3.select(chartEl).append("svg").attr("viewBox", `0 0 ${w} ${h}`);
    const y = d3.scaleBand().domain(items.map((d) => `${d.name} (${d.uf})`)).range([m.top, h - m.bottom]).padding(0.18);
    const x = d3.scaleLinear().domain([0, d3.max(items, (d) => d.pop2024) || 1]).range([m.left, w - m.right]);

    svg.append("g").attr("transform", `translate(${m.left},0)`).call(d3.axisLeft(y).tickSize(0)).attr("font-family", "JetBrains Mono, monospace").attr("font-size", 10);
    svg.selectAll("rect").data(items).enter().append("rect")
      .attr("x", m.left + 2).attr("y", (d) => y(`${d.name} (${d.uf})`)).attr("height", y.bandwidth())
      .attr("width", (d) => Math.max(4, x(d.pop2024) - m.left))
      .attr("fill", (d) => mode === "smallest30" ? "#2a78d6" : d.pop2024 >= 1000000 ? "#b91c1c" : d.is_capital ? "#fa4d00" : "#7c7060")
      .style("cursor", "pointer")
      .on("mouseenter", (ev, d) => C.showTip(ev, `<div class="tt-kicker">#${d.rank_national} NO BRASIL · ${d.is_capital ? "CAPITAL" : "NÃO-CAPITAL"}</div><div class="tt-title">${d.name} (${d.uf})</div><div><b>População 2024:</b> ${C.fmtInt(d.pop2024)} (${C.fmtDec(d.pct_br, 3)}% BR)</div><div><b>Prefeitura TSE 2024:</b> ${d.mayor_2024} (${d.party_2024})</div>`))
      .on("mousemove", C.moveTip).on("mouseleave", C.hideTip);

    svg.selectAll("text.rk-lbl").data(items).enter().append("text")
      .attr("x", (d) => x(d.pop2024) + 6).attr("y", (d) => y(`${d.name} (${d.uf})`) + y.bandwidth() - 2)
      .attr("font-family", "JetBrains Mono, monospace").attr("font-size", 9.5).attr("fill", "currentColor")
      .text((d) => `${C.fmtInt(d.pop2024)} ${d.is_capital ? "★" : ""} (${d.party_2024})`);
  };

  C.renderTop10AndScatter = function (data, uf = "SP") {
    const top10El = document.getElementById("d3-top10-uf");
    if (!top10El || typeof d3 === "undefined") return;
    top10El.innerHTML = "";
    const list = data.municipios.filter((m) => m.uf === uf).sort((a, b) => b.pop2024 - a.pop2024).slice(0, 10);
    const w = top10El.clientWidth || 500, h = 250;
    const m = { top: 12, right: 105, bottom: 20, left: 155 };
    const svg = d3.select(top10El).append("svg").attr("viewBox", `0 0 ${w} ${h}`);
    const y = d3.scaleBand().domain(list.map((d, i) => `${i + 1}º ${d.name}`)).range([m.top, h - m.bottom]).padding(0.22);
    const x = d3.scaleLinear().domain([0, d3.max(list, (d) => d.pop2024) || 1]).range([m.left, w - m.right]);

    svg.append("g").attr("transform", `translate(${m.left},0)`).call(d3.axisLeft(y).tickSize(0)).attr("font-family", "JetBrains Mono, monospace").attr("font-size", 10);
    svg.selectAll("rect").data(list).enter().append("rect").attr("x", m.left + 2).attr("y", (d, i) => y(`${i + 1}º ${d.name}`)).attr("height", y.bandwidth()).attr("width", (d) => Math.max(4, x(d.pop2024) - m.left)).attr("fill", (d) => d.is_capital ? "#b91c1c" : "#fa4d00");
    svg.selectAll("text.v").data(list).enter().append("text").attr("x", (d) => x(d.pop2024) + 5).attr("y", (d, i) => y(`${i + 1}º ${d.name}`) + y.bandwidth() - 2).attr("font-family", "JetBrains Mono, monospace").attr("font-size", 9.5).attr("fill", "currentColor").text((d) => `${C.fmtInt(d.pop2024)}`);
  };

  C.renderRegionsSection = function (data) {
    const treeEl = document.getElementById("d3-regions-treemap");
    if (!treeEl || typeof d3 === "undefined") return;
    treeEl.innerHTML = "";
    const w = treeEl.clientWidth || 620, h = 320;
    const root = d3.hierarchy({
      name: "Brasil",
      children: data.regions.map((r) => ({
        name: r.region,
        children: data.states.filter((s) => s.region === r.region).map((s) => ({
          name: s.uf, fullName: s.name, region: s.region, value: s.pop2024, pct: s.pct_br, density: s.density
        }))
      }))
    }).sum((d) => d.value).sort((a, b) => b.value - a.value);
    d3.treemap().size([w, h]).paddingInner(2).paddingOuter(3)(root);

    const svg = d3.select(treeEl).append("svg").attr("viewBox", `0 0 ${w} ${h}`);
    const leaves = svg.selectAll("g.leaf").data(root.leaves()).enter().append("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`).style("cursor", "pointer")
      .on("mouseenter", (ev, d) => C.showTip(ev, `<div class="tt-kicker">${d.data.region}</div><div class="tt-title">${d.data.fullName} (${d.data.name})</div><div><b>População 2024:</b> ${C.fmtInt(d.data.value)} (${d.data.pct}% BR)</div><div><b>Densidade:</b> ${C.fmtDec(d.data.density, 1)} hab/km²</div>`))
      .on("mousemove", C.moveTip).on("mouseleave", C.hideTip);

    leaves.append("rect").attr("width", (d) => Math.max(0, d.x1 - d.x0)).attr("height", (d) => Math.max(0, d.y1 - d.y0)).attr("fill", (d) => C.REGION_COLORS[d.data.region] || "#b91c1c").attr("opacity", 0.88);
    leaves.append("text").attr("x", 6).attr("y", 16).attr("font-family", "Anton, sans-serif").attr("font-size", 13).attr("fill", "#fffdf8").text((d) => (d.x1 - d.x0) > 28 && (d.y1 - d.y0) > 22 ? d.data.name : "");
    leaves.append("text").attr("x", 6).attr("y", 30).attr("font-family", "JetBrains Mono, monospace").attr("font-size", 9).attr("fill", "rgba(255,253,248,0.85)").text((d) => (d.x1 - d.x0) > 52 && (d.y1 - d.y0) > 36 ? C.fmtDec(d.data.value / 1e6, 1) + "M" : "");
  };

  C.renderGrowthWaffleAndElectoral = function (data) {
    const divEl = document.getElementById("d3-growth-diverging");
    if (divEl && typeof d3 !== "undefined") {
      divEl.innerHTML = "";
      const topGrow = [...data.municipios].filter((m) => m.pop2024 > 30000).sort((a, b) => b.growth_22_24 - a.growth_22_24).slice(0, 6);
      const topShrink = [...data.municipios].filter((m) => m.pop2024 > 15000).sort((a, b) => a.growth_22_24 - b.growth_22_24).slice(0, 6);
      const combo = [...topGrow, ...topShrink.reverse()];
      const w = divEl.clientWidth || 540, h = 270;
      const m = { top: 12, right: 56, bottom: 20, left: 165 };
      const svg = d3.select(divEl).append("svg").attr("viewBox", `0 0 ${w} ${h}`);
      const y = d3.scaleBand().domain(combo.map((d) => `${d.name} (${d.uf})`)).range([m.top, h - m.bottom]).padding(0.2);
      const x = d3.scaleLinear().domain([-20, 25]).range([m.left, w - m.right]);

      svg.append("g").attr("transform", `translate(${m.left},0)`).call(d3.axisLeft(y).tickSize(0)).attr("font-family", "JetBrains Mono, monospace").attr("font-size", 9.5);
      svg.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", m.top).attr("y2", h - m.bottom).attr("stroke", "currentColor");
      svg.selectAll("rect").data(combo).enter().append("rect").attr("x", (d) => Math.min(x(0), x(Math.max(-18, Math.min(24, d.growth_22_24))))).attr("y", (d) => y(`${d.name} (${d.uf})`)).attr("width", (d) => Math.max(3, Math.abs(x(Math.max(-18, Math.min(24, d.growth_22_24))) - x(0)))).attr("height", y.bandwidth()).attr("fill", (d) => d.growth_22_24 >= 0 ? "#166534" : "#b91c1c");
      svg.selectAll("text.gv").data(combo).enter().append("text").attr("x", (d) => d.growth_22_24 >= 0 ? x(Math.min(24, d.growth_22_24)) + 4 : x(Math.max(-18, d.growth_22_24)) - 4).attr("y", (d) => y(`${d.name} (${d.uf})`) + y.bandwidth() - 2).attr("text-anchor", (d) => d.growth_22_24 >= 0 ? "start" : "end").attr("font-family", "JetBrains Mono, monospace").attr("font-size", 9).attr("fill", "currentColor").text((d) => (d.growth_22_24 >= 0 ? "+" : "") + C.fmtDec(d.growth_22_24, 1) + "%");
    }

    const wafEl = document.getElementById("d3-waffle-metropoles");
    if (wafEl && typeof d3 !== "undefined") {
      wafEl.innerHTML = "";
      const cells = d3.range(100).map((i) => ({ idx: i, group: i < 20 ? "15 Metrópoles > 1 milhão (20,1% do Brasil)" : i < 58 ? "305 Cidades entre 100 mil e 1 mi (38,4%)" : "5.250 Municípios < 100 mil (41,5%)" }));
      const svg = d3.select(wafEl).append("svg").attr("viewBox", "0 0 260 260");
      svg.selectAll("rect").data(cells).enter().append("rect").attr("x", (d) => (d.idx % 10) * 25 + 6).attr("y", (d) => Math.floor(d.idx / 10) * 25 + 6).attr("width", 21).attr("height", 21).attr("rx", 2).attr("fill", (d) => d.idx < 20 ? "#b91c1c" : d.idx < 58 ? "#fa4d00" : "#d8cdb6").attr("stroke", "#2a1503").attr("stroke-width", 0.8)
        .on("mouseenter", (ev, d) => C.showTip(ev, `<div class="tt-kicker">BLOCO ${d.idx + 1}/100 · ~2,12 MILHÕES HAB.</div><div class="tt-title">${d.group}</div>`))
        .on("mousemove", C.moveTip).on("mouseleave", C.hideTip);
    }

    const pEl = document.getElementById("d3-tse-parties");
    if (pEl && typeof d3 !== "undefined") {
      pEl.innerHTML = "";
      const parties = data.tse2024.parties_mayors;
      const w = pEl.clientWidth || 560, h = 320;
      const m = { top: 14, right: 118, bottom: 22, left: 110 };
      const svg = d3.select(pEl).append("svg").attr("viewBox", `0 0 ${w} ${h}`);
      const y = d3.scaleBand().domain(parties.map((d) => d.party)).range([m.top, h - m.bottom]).padding(0.22);
      const x = d3.scaleLinear().domain([0, 960]).range([m.left, w - m.right]);

      svg.append("g").attr("transform", `translate(${m.left},0)`).call(d3.axisLeft(y).tickSize(0)).attr("font-family", "JetBrains Mono, monospace").attr("font-size", 10);
      svg.selectAll("rect").data(parties).enter().append("rect").attr("x", m.left + 2).attr("y", (d) => y(d.party)).attr("height", y.bandwidth()).attr("width", (d) => x(d.mayors_2024) - m.left).attr("fill", (d) => d.color).style("cursor", "pointer")
        .on("mouseenter", (ev, d) => C.showTip(ev, `<div class="tt-kicker">TSE 2024 · ${d.spectrum}</div><div class="tt-title">${d.party}: ${d.mayors_2024} Prefeituras</div><div><b>Vs. 2020:</b> ${d.diff >= 0 ? "+" : ""}${d.diff} prefeituras · <b>Capitais:</b> ${d.capitals}</div><div><b>População Governada:</b> ${C.fmtInt(d.pop_governed)} hab.</div><div><b>Fundo Eleitoral (FEFC):</b> R$ ${C.fmtDec(d.fefc_m, 1)} mi</div>`))
        .on("mousemove", C.moveTip).on("mouseleave", C.hideTip);
      svg.selectAll("text.pl").data(parties).enter().append("text").attr("x", (d) => x(d.mayors_2024) + 5).attr("y", (d) => y(d.party) + y.bandwidth() - 2).attr("font-family", "JetBrains Mono, monospace").attr("font-size", 9.5).attr("fill", "currentColor").text((d) => `${d.mayors_2024} (${d.diff >= 0 ? "+" : ""}${d.diff})`);
    }

    // 10.2 CÂMBIO E PACOTE FISCAL: EIXO X EM 90 GRAUS + LINHAS VERTICAIS NOS MARCOS
    const fEl = document.getElementById("d3-fiscal-market");
    if (fEl && typeof d3 !== "undefined") {
      fEl.innerHTML = "";
      const s = data.tse2024.fiscal_market_series.map((d) => ({ ...d, shortDate: d.day.split(" ")[0] + "/24" }));
      const w = fEl.clientWidth || 560, h = 340;
      const m = { top: 44, right: 28, bottom: 78, left: 56 };
      const svg = d3.select(fEl).append("svg").attr("viewBox", `0 0 ${w} ${h}`);
      const x = d3.scalePoint().domain(s.map((d) => d.shortDate)).range([m.left, w - m.right]).padding(0.25);
      const yUsd = d3.scaleLinear().domain([5.55, 6.40]).range([h - m.bottom, m.top]);

      svg.append("g").attr("transform", `translate(0,${h - m.bottom})`).call(d3.axisBottom(x))
        .selectAll("text").attr("transform", "rotate(-90)").attr("text-anchor", "end").attr("dx", "-0.7em").attr("dy", "-0.35em")
        .attr("font-family", "JetBrains Mono, monospace").attr("font-size", 10);

      svg.append("g").attr("transform", `translate(${m.left},0)`).call(d3.axisLeft(yUsd).ticks(5).tickFormat((d) => "R$ " + d.toFixed(2))).attr("font-family", "JetBrains Mono, monospace").attr("font-size", 9.5);

      const fxMarkers = [
        { num: "1", i: 0, shortLabel: "2º Turno", badge: "MARCO ① · 27 OUT 2024", headline: "2º Turno encerra eleição com vitória de PSD (887) e MDB (856); foco vira pacote fiscal", source: "TSE / Folha" },
        { num: "2", i: 3, shortLabel: "Pacote 70bi", badge: "MARCO ② · 27 NOV 2024", headline: "Anúncio do pacote de R$ 70 bi e isenção de IR até R$ 5 mil leva dólar a R$ 5,91", source: "Valor / G1" },
        { num: "3", i: 5, shortLabel: "Votação", badge: "MARCO ③ · 18 DEZ 2024", headline: "Tensão na votação do PLP/PEC na Câmara e Senado faz dólar testar R$ 6,26", source: "Agência Câmara" },
        { num: "4", i: 6, shortLabel: "Sanção/STF", badge: "MARCO ④ · DEZ 2024 / 2025", headline: "Congresso aprova trava do salário mínimo (0,6% a 2,5%) e STF cobra rastreabilidade em emendas Pix", source: "Senado / STF" }
      ];

      fxMarkers.forEach((mk) => {
        const px = x(s[mk.i].shortDate);
        svg.append("line").attr("x1", px).attr("x2", px).attr("y1", m.top - 6).attr("y2", h - m.bottom).attr("stroke", "#b91c1c").attr("stroke-width", 1.3).attr("stroke-dasharray", "4,3").attr("opacity", 0.72);
        svg.append("text").attr("x", px).attr("y", m.top - 12).attr("text-anchor", "middle").attr("font-family", "Atlas Grotesk, Archivo, sans-serif").attr("font-size", 9.5).attr("font-weight", 700).attr("fill", "#b91c1c").text(mk.shortLabel);
      });

      svg.append("path").datum(s).attr("fill", "none").attr("stroke", "#b91c1c").attr("stroke-width", 3).attr("d", d3.line().x((d) => x(d.shortDate)).y((d) => yUsd(d.usd_brl)).curve(d3.curveMonotoneX));

      svg.selectAll("circle.fx").data(s).enter().append("circle").attr("cx", (d) => x(d.shortDate)).attr("cy", (d) => yUsd(d.usd_brl)).attr("r", 5.5).attr("fill", "#b91c1c").attr("stroke", "#fffdf8").attr("stroke-width", 2).style("cursor", "pointer")
        .on("mouseenter", (ev, d) => {
          C.setFactBanner("fact-banner-eleicoes", d.shortDate, `Dólar R$ ${C.fmtDec(d.usd_brl, 2)} · ${d.event}`, "BC / Fazenda / Congresso");
          C.showTip(ev, `<div class="tt-kicker">${d.shortDate} · MARCO PÓS-ELEIÇÃO</div><div class="tt-title">Dólar: R$ ${C.fmtDec(d.usd_brl, 2)} · Ibov: ${C.fmtDec(d.ibov_k, 1)}k</div><div>${d.event}</div>`);
        })
        .on("mousemove", C.moveTip).on("mouseleave", C.hideTip);

      const gPin = svg.selectAll("g.fx-pin").data(fxMarkers).enter().append("g").attr("class", "fact-marker").attr("transform", (d) => `translate(${x(s[d.i].shortDate)},${yUsd(s[d.i].usd_brl) - 20})`)
        .on("mouseenter", (ev, d) => { C.setFactBanner("fact-banner-eleicoes", d.badge, d.headline, d.source); C.showTip(ev, `<div class="tt-kicker">${d.badge} · ${d.source}</div><div class="tt-title">${d.headline}</div>`); })
        .on("mousemove", C.moveTip).on("mouseleave", C.hideTip);
      gPin.append("circle").attr("class", "pin-bg").attr("r", 10).attr("fill", "#b91c1c").attr("stroke", "#fffdf8").attr("stroke-width", 1.8);
      gPin.append("text").attr("text-anchor", "middle").attr("dy", "0.35em").attr("font-family", "Atlas Grotesk, sans-serif").attr("font-size", 10).attr("font-weight", 800).attr("fill", "#fff").text((d) => d.num);
    }
  };

  // 10.3 ESCADA DO PODER: PRESIDENTE (2026), GOVERNADORES ELEITOS (27), SENADORES ELEITOS (54) E PREFEITOS (5.570)
  C.renderPowerLadderChart = function (data, tab = "governadores_27") {
    const el = document.getElementById("d3-power-ladder");
    if (!el || typeof d3 === "undefined" || !data.congress) return;
    el.innerHTML = "";
    const list = data.congress[tab] || data.congress.governadores_27;
    const isPres = tab === "presidente_br";
    const totalSeats = tab === "senado_2026" ? 54 : tab === "prefeitos_2024" ? 5569 : 27;

    const w = el.clientWidth || 620, h = list.length * (isPres ? 38 : 26) + 34;
    const m = { top: 14, right: isPres ? 145 : 115, bottom: 20, left: isPres ? 195 : 116 };
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${w} ${h}`);
    const y = d3.scaleBand().domain(list.map((d) => d.party)).range([m.top, h - m.bottom]).padding(0.24);
    const x = d3.scaleLinear().domain([0, d3.max(list, (d) => d.seats) || 1]).range([m.left, w - m.right]);

    svg.append("g").attr("transform", `translate(${m.left},0)`).call(d3.axisLeft(y).tickSize(0)).attr("font-family", "JetBrains Mono, monospace").attr("font-size", 10);
    svg.selectAll("rect").data(list).enter().append("rect").attr("x", m.left + 2).attr("y", (d) => y(d.party)).attr("height", y.bandwidth()).attr("width", (d) => Math.max(4, x(d.seats) - m.left)).attr("fill", (d) => d.color).style("cursor", "pointer")
      .on("mouseenter", (ev, d) => {
        const pct = isPres ? d.pct_fixed.toFixed(2) : ((d.seats / totalSeats) * 100).toFixed(1);
        const unit = tab === "governadores_27" ? "estados" : tab === "senado_2026" ? "senadores eleitos em 2026" : "prefeituras";
        const valStr = isPres ? `${C.fmtInt(d.seats)} votos (${pct}%)` : `${d.seats} ${unit} (${pct}%)`;
        C.showTip(ev, `<div class="tt-kicker">TSE · MAPA DO PODER 2024 A 2026</div><div class="tt-title">${d.party}: ${valStr}</div><div>${isPres ? "Resultado oficial proclamado pelo TSE." : `Proporção calculada sobre o total de ${totalSeats}.`}</div>`);
      })
      .on("mousemove", C.moveTip).on("mouseleave", C.hideTip);
    svg.selectAll("text.val").data(list).enter().append("text").attr("x", (d) => x(d.seats) + 6).attr("y", (d) => y(d.party) + y.bandwidth() / 2 + 4).attr("font-family", "JetBrains Mono, monospace").attr("font-size", 9.5).attr("fill", "currentColor").text((d) => isPres ? `${C.fmtDec(d.seats / 1e6, 2)}M (${d.pct_fixed.toFixed(2)}%)` : `${d.seats} (${((d.seats / totalSeats) * 100).toFixed(1)}%)`);
  };
})();
