import { PeruSeedData } from '../types';

export const PERU_SEED_DATA: PeruSeedData = {
  weatherMap: {
    'Chosica': {
      city: 'Chosica',
      temperature: 22,
      condition: 'Soleado',
      humidity: 68,
      aqi: 45, // Aire limpio
      source: 'SENAMHI (Caché local offline)',
      timestamp: '2026-07-27 16:00'
    },
    'Lima': {
      city: 'Lima',
      temperature: 18,
      condition: 'Nublado',
      humidity: 82,
      aqi: 62,
      source: 'SENAMHI (Caché local offline)',
      timestamp: '2026-07-27 16:00'
    },
    'Cusco': {
      city: 'Cusco',
      temperature: 14,
      condition: 'Soleado',
      humidity: 45,
      aqi: 20,
      source: 'SENAMHI (Caché local offline)',
      timestamp: '2026-07-27 16:00'
    },
    'Huaraz': {
      city: 'Huaraz',
      temperature: 15,
      condition: 'Lluvia',
      humidity: 78,
      aqi: 18,
      source: 'SENAMHI (Caché local offline)',
      timestamp: '2026-07-27 16:00'
    },
    'Piura': {
      city: 'Piura',
      temperature: 28,
      condition: 'Soleado',
      humidity: 55,
      aqi: 35,
      source: 'SENAMHI (Caché local offline)',
      timestamp: '2026-07-27 16:00'
    }
  },
  huaicoMap: {
    'Chosica': {
      city: 'Chosica',
      riskPercent: 85,
      level: 'Peligro Crítico',
      safeZoneName: 'I.E. 123 - Av. Lima Sur 450',
      safeZoneDist: '500m',
      source: 'SENAMHI / INDECI (Seed local)'
    },
    'Lima': {
      city: 'Lima',
      riskPercent: 20,
      level: 'Bajo',
      safeZoneName: 'Parque de la Reserva',
      safeZoneDist: '1.2km',
      source: 'SENAMHI / INDECI (Seed local)'
    },
    'Huaraz': {
      city: 'Huaraz',
      riskPercent: 65,
      level: 'Alto',
      safeZoneName: 'Plaza de Armas Huaraz',
      safeZoneDist: '800m',
      source: 'SENAMHI / INDECI (Seed local)'
    },
    'Cusco': {
      city: 'Cusco',
      riskPercent: 35,
      level: 'Moderado',
      safeZoneName: 'Esplanada Sacsayhuamán',
      safeZoneDist: '1.5km',
      source: 'SENAMHI / INDECI (Seed local)'
    },
    'Piura': {
      city: 'Piura',
      riskPercent: 40,
      level: 'Moderado',
      safeZoneName: 'Estadio Miguel Grau',
      safeZoneDist: '2.0km',
      source: 'SENAMHI / INDECI (Seed local)'
    }
  },
  sismoLatest: {
    magnitude: 4.8,
    epicenter: '42 km al Oeste de Callao, Lima',
    depth: '35 km',
    time: '2026-07-27 12:14:00',
    source: 'IGP (Instituto Geofísico del Perú)'
  },
  minsaGuides: [
    {
      condition: 'Dengue',
      diagnosis: 'Fiebre alta repentina, dolor retroocular, mialgias y exantema.',
      treatment: 'Hidratación oral abundante, paracetamol. NO usar AINEs (ibuprofeno, aspirina) por riesgo hemorrágico.',
      precautions: ['Monitorear signos de alarma (dolor abdominal severo, sangrado)', 'Reposo absoluto']
    },
    {
      condition: 'Celulitis infecciosa',
      diagnosis: 'Eritema, calor local, edema y dolor cutáneo progresivo.',
      treatment: 'Antibioticoterapia oral (Cefalexina o Amoxicilina + ácido clavulánico) previa evaluación médica.',
      precautions: ['Elevar la extremidad afectada', 'Demarcar borde del eritema para controlar extensión']
    },
    {
      condition: 'Diarrea aguda',
      diagnosis: 'Aumento en frecuencia y disminución en consistencia de deposiciones.',
      treatment: 'Sales de Rehidratación Oral (SRO) solución OMS, dieta blanda astringente.',
      precautions: ['Evitar antidiarreicos en lactantes o diarreas sangrientas', 'Lavado estricto de manos']
    },
    {
      condition: 'Asma bronquial',
      diagnosis: 'Sibilancias expiratorias, disnea episódica, tos nocturna.',
      treatment: 'Broncodilatador de acción corta (Salbutamol 2 pufs c/4-6h) + corticoide inhalado de mantenimiento.',
      precautions: ['Evitar desencadenantes (polvo, cambio de clima)', 'Tener plan de crisis en mano']
    },
    {
      condition: 'Hipertensión arterial',
      diagnosis: 'Presión arterial sistólica ≥ 140 mmHg y/o diastólica ≥ 90 mmHg.',
      treatment: 'Antihipertensivos prescritos (Losartán, Enalapril o Amlodipino) + dieta hiposódica.',
      precautions: ['Tomar la presión diariamente', 'No suspender bruscamente la medicación']
    },
    {
      condition: 'Diabetes Mellitus Tipo 2',
      diagnosis: 'Glucemia en ayunas ≥ 126 mg/dL en dos tomas o HbA1c ≥ 6.5%.',
      treatment: 'Metformina, cambios alimentarios, ejercicio aeróbico regular.',
      precautions: ['Cuidado e inspección diaria de pies', 'Evitar carbohidratos simples']
    },
    {
      condition: 'COVID-19',
      diagnosis: 'Sintomatología respiratoria, pérdida de olfato/gusto, prueba antigénica positiva.',
      treatment: 'Sintomático (Paracetamol, descanso), monitoreo de pulsioximetría.',
      precautions: ['Aislamiento preventivo', 'Acudir a urgencias si SatO2 < 93%']
    },
    {
      condition: 'Tuberculosis (TBC)',
      diagnosis: 'Tos con flema por más de 15 días (Sintomático Respiratorio).',
      treatment: 'Esquema sensible MINSA supervisado (Isoniazida, Rifampicina, Pirazinamida, Etambutol).',
      precautions: ['Tratamiento gratuito y obligatorio', 'Ventilación de ambientes']
    },
    {
      condition: 'Neumonía adquirida en la comunidad',
      diagnosis: 'Tos productiva, fiebre, escalofríos, dolor torácico crepitante.',
      treatment: 'Amoxicilina alta dosis u otros betalactámicos + macrólidos.',
      precautions: ['Descartar taquipnea y dificultad respiratoria', 'Evaluar riesgo de hospitalización']
    },
    {
      condition: 'Anemia ferropénica',
      diagnosis: 'Hemoglobina < 11-12 g/dL con palidez de mucosas y fatiga.',
      treatment: 'Sulfato ferroso o hierro polimaltosado oral + vitamina C para absorción.',
      precautions: ['Consumir sangrecita, hígado y menestras', 'Evitar té/café junto a la dosis']
    }
  ],
  ineiCities: {
    'Chosica': { population: '240,000 hab.', povertyRate: '14.2%', idh: '0.685', waterAccess: '82%' },
    'Lima': { population: '10,200,000 hab.', povertyRate: '18.9%', idh: '0.742', waterAccess: '91%' },
    'Cusco': { population: '450,000 hab.', povertyRate: '21.5%', idh: '0.672', waterAccess: '86%' },
    'Huaraz': { population: '130,000 hab.', povertyRate: '24.1%', idh: '0.640', waterAccess: '79%' },
    'Piura': { population: '520,000 hab.', povertyRate: '26.8%', idh: '0.655', waterAccess: '75%' }
  },
  safeZones: {
    'Chosica': [
      { name: 'I.E. 123 Felipe Huamán Poma', address: 'Av. Lima Sur 450, Chosica', dist: '500m' },
      { name: 'Coliseo Municipal de Chosica', address: 'Jr. Arequipa 120, Chosica', dist: '900m' },
      { name: 'Estadio Sol de Chosica', address: 'Av. Nicolás de Piérola s/n', dist: '1.4km' }
    ],
    'Lima': [
      { name: 'Parque de la Reserva', address: 'Av. Arequipa cdra 5, Lima', dist: '1.2km' },
      { name: 'Campo de Marte', address: 'Av. Salaverry, Jesús María', dist: '1.8km' }
    ],
    'Cusco': [
      { name: 'Esplanada Sacsayhuamán', address: 'Camino Alto Sacsayhuamán', dist: '1.5km' },
      { name: 'Plaza Mayor del Cusco', address: 'Portal de Panes, Cusco', dist: '600m' }
    ]
  }
};
