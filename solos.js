/**
 * SISTEMA AGROSMART v5.2 - Correção Definitiva de Datas
 */

document.addEventListener('DOMContentLoaded', function() {
    initChart();
    setupListeners();
    
    // 1) LÓGICA ONLINE: Define a data de hoje ao abrir o site
    setCurrentDate();

    recalculate();
});

function setupListeners() {
    const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
    inputs.forEach(input => {
        input.addEventListener('input', recalculate);
    });
}

// Função auxiliar para definir data atual
function setCurrentDate() {
    const dateEl = document.getElementById('display_date');
    if (dateEl) {
        const today = new Date();
        const dateString = today.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        dateEl.innerText = dateString;
    }
}

// --- MAPEAMENTO DO EXCEL ---
const fieldMap = [
    // Mapeamento EXATO do campo no seu modelo.xlsx
    { id: 'display_date', label: 'Data da Análise' },
    
    { id: 'client_name', label: 'Nome do Cliente' },
    { id: 'property_name', label: 'Propriedade' },
    { id: 'city_name', label: 'Município' },
    { id: 'lab_name', label: 'Laboratório' },
    { id: 'sample_id', label: 'Amostra' },
    { id: 'depth_val', label: 'Profundidade' },
    { id: 'area', label: 'Área (ha)' },
    { id: 'ph_agua', label: 'pH Água' },
    { id: 'ph_cacl', label: 'pH CaCl2' },
    { id: 'al', label: 'Al (cmol/dm³)' }, // Ajustado conforme seu modelo
    { id: 'ca', label: 'Ca (cmol/dm³)' },
    { id: 'mg', label: 'Mg (cmol/dm³)' },
    { id: 'hal', label: 'H+Al (cmol/dm³)' },
    { id: 'k', label: 'K (cmol/dm³)' },
    { id: 'p', label: 'P (mg/dm³) Melich' }, // Ajustado conforme seu modelo
    { id: 'mo', label: 'M. Org. (g/dm³)' }, // Ajustado conforme seu modelo
    { id: 'micro_s', label: 'Enxofre (S)' },
    { id: 'micro_mn', label: 'Manganês (Mn)' },
    { id: 'micro_cu', label: 'Cobre (Cu)' },
    { id: 'micro_zn', label: 'Zinco (Zn)' },
    { id: 'micro_fe', label: 'Ferro (Fe)' },
    { id: 'micro_b', label: 'Boro (B)' }
];

function downloadTemplate() {
    const link = document.createElement('a');
    link.href = 'modelo.xlsx';
    link.download = 'modelo.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // raw: false força datas a virem como string formatada se possível
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'dd/mm/yyyy' });
        
        let updatedCount = 0;
        
        for (let i = 0; i < json.length; i++) {
            const row = json[i];
            
            // Verifica se a linha tem dados
            if (row && row.length >= 2 && row[0]) {
                const excelLabel = row[0].toString().trim();
                let excelValue = row[1];

                const mapItem = fieldMap.find(m => m.label === excelLabel);
                
                if (mapItem && excelValue !== undefined && excelValue !== null) {
                    const el = document.getElementById(mapItem.id);
                    if (el) {
                        // Tratamento especial para Data (se vier no formato yyyy-mm-dd do Excel raw)
                        if (mapItem.id === 'display_date' && typeof excelValue === 'string' && excelValue.includes('-')) {
                            // Tenta converter AAAA-MM-DD para DD/MM/AAAA se necessário
                            const parts = excelValue.split('-');
                            if (parts.length === 3 && parts[0].length === 4) {
                                excelValue = `${parts[2]}/${parts[1]}/${parts[0]}`;
                            }
                        }

                        // Aplica o valor ao elemento correto (Input ou Texto)
                        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                            el.value = excelValue;
                        } else {
                            el.innerText = excelValue; // Atualiza o SPAN da data
                        }
                        updatedCount++;
                    }
                }
            }
        }
        
        recalculate();
        alert(`Dados carregados com sucesso! ${updatedCount} campos atualizados.`);
        input.value = ''; // Permite recarregar o mesmo arquivo
    };
    reader.readAsArrayBuffer(file);
}

function resetForm() {
    if(confirm("Deseja limpar todos os dados e iniciar um novo relatório?")) {
        document.querySelectorAll('input[type="number"]').forEach(i => i.value = 0);
        document.querySelectorAll('input[type="text"]').forEach(i => i.value = "");
        
        // Restaura valores padrão para não quebrar cálculos
        document.getElementById('ph_agua').value = 0;
        document.getElementById('target_v').value = 70;
        document.getElementById('prnt').value = 80;
        
        // 2) LÓGICA NOVO RELATÓRIO: Restaura a data de hoje
        setCurrentDate();
        
        recalculate();
    }
}

// --- GERAÇÃO DE PDF (Mantida a lógica visual anterior) ---
function generatePDF() {
    const client = document.getElementById('client_name').value;
    const ph = parseFloat(document.getElementById('ph_agua').value);

    if (!client || ph === 0) {
        alert("Preencha os dados do cliente e da análise antes de gerar o PDF.");
        return;
    }

    // 1. Sincroniza Dados do HTML para o PDF Oculto
    // Garante que a data mostrada no PDF seja a mesma que está no cabeçalho (seja importada ou de hoje)
    document.getElementById('pdf_date').innerText = document.getElementById('display_date').innerText;
    
    document.getElementById('pdf_client').innerText = client;
    document.getElementById('pdf_prop').innerText = document.getElementById('property_name').value;
    document.getElementById('pdf_city').innerText = document.getElementById('city_name').value;
    document.getElementById('pdf_lab').innerText = document.getElementById('lab_name').value;
    document.getElementById('pdf_sample').innerText = document.getElementById('sample_id').value;
    document.getElementById('pdf_depth').innerText = document.getElementById('depth_val').value;
    document.getElementById('pdf_area').innerText = document.getElementById('area').value;

    // 2. Mapa Nutricional (Dados)
    const d = {
        ph_cacl: parseFloat(document.getElementById('ph_cacl').value),
        al: parseFloat(document.getElementById('al').value),
        ca: parseFloat(document.getElementById('ca').value),
        mg: parseFloat(document.getElementById('mg').value),
        k: parseFloat(document.getElementById('k').value),
        p: parseFloat(document.getElementById('p').value),
        v: parseFloat(document.getElementById('res_v').innerText),
        mo: parseFloat(document.getElementById('mo').value),
        s: parseFloat(document.getElementById('micro_s').value),
        mn: parseFloat(document.getElementById('micro_mn').value),
        zn: parseFloat(document.getElementById('micro_zn').value),
        b: parseFloat(document.getElementById('micro_b').value),
        cu: parseFloat(document.getElementById('micro_cu').value),
        fe: parseFloat(document.getElementById('micro_fe').value)
    };

    const createHeatRow = (label, val, min, max, unit) => {
        const rangeMax = max * 1.5; 
        let percent = (val / rangeMax) * 100;
        if(percent > 100) percent = 100; if(percent < 0) percent = 0;
        let status = 'Médio';
        if(val < min) status = 'Baixo'; else if(val > max) status = 'Alto';
        
        return `
            <tr>
                <td><strong>${label}</strong> <small>(${unit})</small></td>
                <td style="text-align:center">${val}</td>
                <td><div class="heatmap-bar-container"><div class="heatmap-marker" style="left: ${percent}%"></div></div></td>
                <td style="font-size:0.65rem; font-weight:bold; text-align:center">${status}</td>
            </tr>
        `;
    };

    let heatHTML = '';
    heatHTML += `<tr><td colspan="4" class="pdf-subheader">Resultados da Análise Química</td></tr>`;
    heatHTML += createHeatRow('pH CaCl2', d.ph_cacl, 4.8, 5.5, '');
    heatHTML += createHeatRow('Alumínio (Al)', d.al, 0.2, 0.5, 'cmol');
    heatHTML += createHeatRow('Cálcio (Ca)', d.ca, 2.5, 4.0, 'cmol');
    heatHTML += createHeatRow('Magnésio (Mg)', d.mg, 0.8, 1.5, 'cmol');
    heatHTML += createHeatRow('Potássio (K)', d.k, 0.20, 0.40, 'cmol');
    heatHTML += createHeatRow('Fósforo (P)', d.p, 10, 20, 'mg');
    heatHTML += createHeatRow('Sat. Bases (V%)', d.v, 50, 70, '%');
    heatHTML += createHeatRow('Matéria Org.', d.mo, 25, 40, 'g');
    heatHTML += `<tr><td colspan="4" class="pdf-subheader">Micronutrientes</td></tr>`;
    heatHTML += createHeatRow('Enxofre (S)', d.s, 5, 10, 'mg');
    heatHTML += createHeatRow('Manganês (Mn)', d.mn, 2, 5, 'mg');
    heatHTML += createHeatRow('Zinco (Zn)', d.zn, 1.0, 2.0, 'mg');
    heatHTML += createHeatRow('Boro (B)', d.b, 0.3, 0.6, 'mg');
    heatHTML += createHeatRow('Cobre (Cu)', d.cu, 0.8, 1.2, 'mg');
    heatHTML += createHeatRow('Ferro (Fe)', d.fe, 12, 20, 'mg');

    document.getElementById('pdf_heatmap_body').innerHTML = heatHTML;

    // 3. Fertigrama CSS
    const phVal = parseFloat(document.getElementById('ph_agua').value);
    const pVals = [
        { l: 'pH', v: (phVal/7)*100, c: '#4caf50' },
        { l: 'Al', v: (d.al/15)*100, c: '#f44336' },
        { l: 'MO', v: (d.mo/25)*100, c: '#795548' },
        { l: 'P',  v: (d.p/8)*100, c: '#ff9800' },
        { l: 'K',  v: (d.k/0.3)*100, c: '#9c27b0' },
        { l: 'Ca', v: (d.ca/4)*100, c: '#2196f3' },
        { l: 'Mg', v: (d.mg/0.8)*100, c: '#03a9f4' },
        { l: 'Zn', v: (d.zn/1.6)*100, c: '#9e9e9e' }
    ];
    let fertHTML = '<div class="line-100"></div>'; 
    pVals.forEach(item => {
        let h = (item.v / 150) * 100; if(h>100) h=100;
        fertHTML += `<div class="fert-col"><div class="fert-bar-wrapper"><div class="fert-bar" style="height: ${h}%; background-color: ${item.c}; width: 100%;"><span class="fert-val">${item.v.toFixed(0)}%</span></div></div><div class="fert-label">${item.l}</div></div>`;
    });
    document.getElementById('pdf_fertigram_body').innerHTML = fertHTML;

    // 4. Copiar Tabelas
    document.getElementById('pdf_relations_table').innerHTML = document.getElementById('relationsBody').innerHTML;
    document.getElementById('pdf_saturation_table').innerHTML = document.getElementById('saturationBody').innerHTML;
    const corrSource = document.getElementById('correctionBody');
    let corrHTML = '';
    for(let row of corrSource.rows) {
        corrHTML += `<tr><td>${row.cells[0].innerText}</td><td>${row.cells[1].innerText}</td><td style="text-align:center">${row.cells[4].innerText}</td><td style="text-align:center">${row.cells[5].innerText}</td></tr>`;
    }
    document.getElementById('pdf_correction_body').innerHTML = corrHTML;

    // 5. Gerar PDF
    const element = document.getElementById('pdf-report');
    element.style.display = 'block';

    const opt = {
        margin:       10, 
        filename:     `Laudo_${client}.pdf`,
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2, useCORS: true, scrollY: 0 }, 
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    document.querySelector('.data-controls-hide-on-pdf').style.display = 'none';
    document.querySelector('.btn-pdf').style.display = 'none';

    html2pdf().set(opt).from(element).save().then(() => {
        element.style.display = 'none';
        document.querySelector('.data-controls-hide-on-pdf').style.display = 'block';
        document.querySelector('.btn-pdf').style.display = 'flex';
    });
}

// --- CÁLCULOS DO DASHBOARD ---
let fertiChart;
function initChart() {
    fertiChart = Highcharts.chart('fertigramChart', {
        chart: { type: 'column', backgroundColor: 'transparent', height: 450, marginRight: 100, animation: false },
        title: { text: '' },
        xAxis: { categories: ['pH', 'Al', 'M.O.', 'P', 'K', 'Ca', 'Mg', 'Fe', 'Mn', 'Zn', 'Cu'], crosshair: true, lineColor: '#e0e0e0', labels: { style: { color: '#555', fontWeight: 'bold' } } },
        yAxis: { min: 0, max: 150, title: { text: '% do Nível Ideal' }, gridLineColor: '#f0f0f0', plotLines: [{ value: 100, color: '#2e7d32', width: 2, zIndex: 10, dashStyle: 'ShortDash', label: {text: 'Meta 100%', style:{color:'#2e7d32', fontWeight:'bold'}, align: 'right', x: 90, y: 5} }], plotBands: [{ from: 0, to: 50, color: 'rgba(255, 235, 238, 0.6)', label: { text: 'BAIXO', align: 'right', x: 90, verticalAlign: 'bottom', y: -15, style: {color:'#d32f2f', fontSize:'12px', fontWeight:'bold'} }, zIndex: 0 }, { from: 50, to: 90, color: 'rgba(255, 249, 196, 0.4)', label: { text: 'MÉDIO', align: 'right', x: 90, verticalAlign: 'bottom', y: -15, style: {color:'#fbc02d', fontSize:'12px', fontWeight:'bold'} }, zIndex: 0 }, { from: 90, to: 150, color: 'rgba(220, 237, 200, 0.4)', label: { text: 'ALTO', align: 'right', x: 90, verticalAlign: 'bottom', y: -15, style: {color:'#388e3c', fontSize:'12px', fontWeight:'bold'} }, zIndex: 0 }] },
        tooltip: { shared: true, valueSuffix: '%', backgroundColor: 'rgba(255,255,255,0.95)' },
        plotOptions: { column: { borderRadius: 2, colorByPoint: true, borderWidth: 0, dataLabels: { enabled: true, inside: true, verticalAlign: 'middle', style: { fontSize: '11px', color: 'white', textOutline: '1px contrast' }, format: '{point.y:.0f}%' } } },
        series: [{ name: 'Nível Atual', data: [] }], credits: { enabled: false }, legend: { enabled: false }
    });
}

function recalculate() {
    const getVal = (id) => parseFloat(document.getElementById(id).value) || 0;
    const d = { area: getVal('area'), ph: getVal('ph_agua'), ph_cacl: getVal('ph_cacl'), al: getVal('al'), ca: getVal('ca'), mg: getVal('mg'), hal: getVal('hal'), k: getVal('k'), p: getVal('p'), mo: getVal('mo'), targetV: getVal('target_v'), prnt: getVal('prnt'), s: getVal('micro_s'), cu: getVal('micro_cu'), fe: getVal('micro_fe'), mn: getVal('micro_mn'), zn: getVal('micro_zn'), b: getVal('micro_b') };
    document.getElementById('lbl_area').innerText = d.area;
    const SB = d.ca + d.mg + d.k; const CTC = SB + d.hal; const V = CTC > 0 ? (SB / CTC) * 100 : 0;
    document.getElementById('res_ctc').innerText = CTC.toFixed(2); document.getElementById('res_v').innerText = V.toFixed(2);
    updateClassification(d, V);
    const sat = (val) => CTC > 0 ? (val/CTC)*100 : 0; const h_pure = d.hal - d.al;
    document.getElementById('saturationBody').innerHTML = `<tr><td>Potássio (K)</td><td>2 a 5%</td><td><strong>${sat(d.k).toFixed(2)}%</strong></td></tr><tr><td>Cálcio (Ca)</td><td>50 a 70%</td><td><strong>${sat(d.ca).toFixed(2)}%</strong></td></tr><tr><td>Magnésio (Mg)</td><td>6 a 20%</td><td><strong>${sat(d.mg).toFixed(2)}%</strong></td></tr><tr><td>Alumínio (Al)</td><td>0%</td><td><strong>${sat(d.al).toFixed(2)}%</strong></td></tr><tr><td>Hidrogênio (H)</td><td>20 a 35%</td><td><strong>${sat(h_pure).toFixed(2)}%</strong></td></tr>`;
    const ca_mg = d.mg > 0 ? d.ca/d.mg : 0; const ca_k = d.k > 0 ? d.ca/d.k : 0; const mg_k = d.k > 0 ? d.mg/d.k : 0; const ca_mg_k = d.k > 0 ? (d.ca + d.mg) / d.k : 0;
    const statusCaMg = (ca_mg < 3) ? '<span class="status-tag st-baixo">Baixa</span>' : '<span class="status-tag st-alto">Alta</span>';
    const statusCaK = evalRelation(ca_k, 10, 30); const statusMgK = evalRelation(mg_k, 3, 10);
    document.getElementById('relationsBody').innerHTML = `<tr><td>Ca / Mg</td><td>${ca_mg.toFixed(2)}</td><td>${statusCaMg}</td></tr><tr><td>Ca / K</td><td>${ca_k.toFixed(1)}</td><td>${statusCaK}</td></tr><tr><td>Mg / K</td><td>${mg_k.toFixed(1)}</td><td>${statusMgK}</td></tr><tr><td>(Ca + Mg) / K</td><td>${ca_mg_k.toFixed(1)}</td><td>-</td></tr>`;
    const micros = [{id: 'class_s', val: d.s, min: 5, max: 10}, {id: 'class_cu', val: d.cu, min: 0.8, max: 1.2}, {id: 'class_fe', val: d.fe, min: 12, max: 20}, {id: 'class_mn', val: d.mn, min: 2, max: 5}, {id: 'class_zn', val: d.zn, min: 1.0, max: 2.0}, {id: 'class_b', val: d.b, min: 0.3, max: 0.6}];
    micros.forEach(m => { const el = document.getElementById(m.id); if(el) el.innerHTML = getMicroClass(m.val, m.min, m.max); });
    const p = { pH: (d.ph / 7.0) * 100, Al: (CTC > 0) ? (d.al / CTC) * 100 : 0, MO: (d.mo / 25.0) * 100, P: (d.p / 8.0) * 100, K: (d.k / 0.3) * 100, Ca: (d.ca / 4.0) * 100, Mg: (d.mg / 0.8) * 100, Fe: (d.fe / 12.0) * 100, Mn: (d.mn / 5.0) * 100, Zn: (d.zn / 1.6) * 100, Cu: (d.cu / 0.8) * 100 };
    document.getElementById('absoluteBody').innerHTML = `<tr><td>Acidez</td><td>pH (7)</td><td>${p.pH.toFixed(2)}%</td></tr><tr><td>Alumínio</td><td>Al</td><td>${p.Al.toFixed(2)}%</td></tr><tr><td>M. Orgânica</td><td>M.O</td><td>${p.MO.toFixed(1)}%</td></tr><tr><td>Fósforo</td><td>P</td><td>${p.P.toFixed(2)}%</td></tr><tr><td>Potássio</td><td>K</td><td>${p.K.toFixed(2)}%</td></tr><tr><td>Cálcio</td><td>Ca</td><td>${p.Ca.toFixed(1)}%</td></tr><tr><td>Magnésio</td><td>Mg</td><td>${p.Mg.toFixed(1)}%</td></tr><tr><td>Ferro</td><td>Fe</td><td>${p.Fe.toFixed(0)}%</td></tr><tr><td>Manganês</td><td>Mn</td><td>${p.Mn.toFixed(0)}%</td></tr><tr><td>Zinco</td><td>Zn</td><td>${p.Zn.toFixed(0)}%</td></tr><tr><td>Cobre</td><td>Cu</td><td>${p.Cu.toFixed(0)}%</td></tr>`;
    fertiChart.series[0].setData([{ y: p.pH, color: '#4caf50' }, { y: p.Al, color: '#f44336' }, { y: p.MO, color: '#795548' }, { y: p.P, color: '#ff9800' }, { y: p.K, color: '#9c27b0' }, { y: p.Ca, color: '#2196f3' }, { y: p.Mg, color: '#03a9f4' }, { y: p.Fe, color: '#5d4037' }, { y: p.Mn, color: '#607d8b' }, { y: p.Zn, color: '#9e9e9e' }, { y: p.Cu, color: '#ff5722' }]);
    let calc_al_puro=0, calc_al_com=0, calc_v_puro=0, calc_v_com=0; if(CTC>0){ let nc_al=d.al*2; calc_al_puro=nc_al; calc_al_com=nc_al/(d.prnt/100); let nc_v=Math.max(0,(d.targetV-V)*CTC/100); calc_v_puro=nc_v; calc_v_com=nc_v/(d.prnt/100); }
    let req_P2O5_total=0; if(d.p>0){ if(d.p<6) req_P2O5_total=90; else if(d.p<12) req_P2O5_total=60; else if(d.p<20) req_P2O5_total=30; } const req_P2O5_gradual=req_P2O5_total*(80/90); const ss_norm_com=req_P2O5_total/0.18; const ss_grad_com=req_P2O5_gradual/0.18; const st_norm_com=req_P2O5_total/0.46; const st_grad_com=req_P2O5_gradual/0.46; const arad_com=req_P2O5_total/0.33;
    let req_K2O=0; if(d.k>0){ if(d.k<0.15) req_K2O=100; else if(d.k<0.30) req_K2O=60; } const kcl_com=req_K2O/0.60;
    const fmt=(n)=>n.toFixed(2); const calcTotal=(doseHa)=>fmt(doseHa*d.area);
    document.getElementById('correctionBody').innerHTML = `<tr><td>Calcário c/ PRNT ${d.prnt}%</td><td>Correção p/ AL+++</td><td>1.0</td><td>${fmt(calc_al_puro)} Ton/ha</td><td><strong>${fmt(calc_al_com)} Ton/ha</strong></td><td>${calcTotal(calc_al_com)} Ton</td></tr><tr><td>Calcário c/ PRNT ${d.prnt}%</td><td>Correção p/ V%</td><td>0.7</td><td>${fmt(calc_v_puro)} Ton/ha</td><td><strong>${fmt(calc_v_com)} Ton/ha</strong></td><td>${calcTotal(calc_v_com)} Ton</td></tr><tr style="background-color: #f9fbe7"><td>Correção Fósforo</td><td>Superfosfato Simples</td><td>1.0</td><td>${req_P2O5_total} kg/ha</td><td><strong>${fmt(ss_norm_com)} kg/ha</strong></td><td>${calcTotal(ss_norm_com)} kg</td></tr><tr style="background-color: #f9fbe7"><td></td><td>Superfosfato Simples</td><td>Gradual</td><td>${Math.round(req_P2O5_gradual)} kg/ha</td><td><strong>${fmt(ss_grad_com)} kg/ha</strong></td><td>${calcTotal(ss_grad_com)} kg</td></tr><tr style="background-color: #f9fbe7"><td></td><td>Superfosfato Triplo</td><td>1.0</td><td>${req_P2O5_total} kg/ha</td><td><strong>${fmt(st_norm_com)} kg/ha</strong></td><td>${calcTotal(st_norm_com)} kg</td></tr><tr style="background-color: #f9fbe7"><td></td><td>Superfosfato Triplo</td><td>Gradual</td><td>${Math.round(req_P2O5_gradual)} kg/ha</td><td><strong>${fmt(st_grad_com)} kg/ha</strong></td><td>${calcTotal(st_grad_com)} kg</td></tr><tr style="background-color: #f9fbe7"><td></td><td>Superfosfato Arad</td><td>1.0</td><td>${req_P2O5_total} kg/ha</td><td><strong>${fmt(arad_com)} kg/ha</strong></td><td>${calcTotal(arad_com)} kg</td></tr><tr><td>Correção Potássio</td><td>Cloreto de Potássio</td><td>1.0</td><td>${req_K2O} kg/ha</td><td><strong>${fmt(kcl_com)} kg/ha</strong></td><td>${calcTotal(kcl_com)} kg</td></tr>`;
}

function updateClassification(d, V) {
    const row = document.getElementById('row_classification');
    const cls = (val, limits) => {
        let txt = '', css = '';
        if(val <= limits[0]) { txt='M. Baixo'; css='st-mbaixo'; }
        else if(val <= limits[1]) { txt='Baixo'; css='st-baixo'; }
        else if(val <= limits[2]) { txt='Médio'; css='st-medio'; }
        else if(val <= limits[3]) { txt='Alto'; css='st-alto'; }
        else { txt='M. Alto'; css='st-malto'; }
        return `<td><span class="status-tag ${css}">${txt}</span></td>`;
    };
    let html = '<td>-</td>'; 
    let ph_cacl_txt = '', ph_cacl_css = ''; if(d.ph_cacl < 4.5) { ph_cacl_txt='M. Alta'; ph_cacl_css='st-malto'; } else if(d.ph_cacl < 5.0) { ph_cacl_txt='Alta'; ph_cacl_css='st-alto'; } else if(d.ph_cacl < 5.5) { ph_cacl_txt='Média'; ph_cacl_css='st-medio'; } else { ph_cacl_txt='Baixa'; ph_cacl_css='st-baixo'; } html += `<td><span class="status-tag ${ph_cacl_css}">${ph_cacl_txt}</span></td>`;
    let al_txt = '', al_css = ''; if(d.al < 0.2) { al_txt='Baixo'; al_css='st-baixo'; } else if(d.al < 0.5) { al_txt='Médio'; al_css='st-medio'; } else { al_txt='Alto'; al_css='st-alto'; } html += `<td><span class="status-tag ${al_css}">${al_txt}</span></td>`;
    html += cls(d.ca, [1.5, 2.5, 4.0, 6.0]); html += cls(d.mg, [0.5, 0.8, 1.5, 2.5]); html += '<td>-</td>'; html += cls(d.k, [0.10, 0.20, 0.40, 0.60]); html += cls(d.p, [5, 10, 20, 40]); html += '<td>-</td>'; html += cls(V, [20, 50, 70, 90]); html += cls(d.mo, [10, 25, 40, 60]);
    row.innerHTML = html;
}

function evalRelation(val, min, max) { if(val >= min && val <= max) return '<span class="status-tag st-alto">Alta</span>'; if(val < min) return '<span class="status-tag st-baixo">Baixa</span>'; return '<span class="status-tag st-malto">M. Alta</span>'; }
function getMicroClass(val, min, max) { if (val === 0 || val === 0.0) return '<span class="status-tag" style="background:#eee; color:#666">Zero</span>'; if(val < min) return '<span class="status-tag st-baixo">Baixo</span>'; if(val > max) return '<span class="status-tag st-alto">Alto</span>'; return '<span class="status-tag st-medio">Médio</span>'; }