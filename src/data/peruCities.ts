/** Catálogo territorial Perú — ciudades y distritos para validación / Pacha / onboarding */

export interface PeruCity {
  city: string;
  region: string;
  districts: string[];
  lat: number;
  lon: number;
}

export const PERU_CITIES: PeruCity[] = [
  { city: 'Lima', region: 'Lima', lat: -12.0464, lon: -77.0428, districts: ['Miraflores', 'San Isidro', 'Surco', 'La Molina', 'San Borja', 'Jesús María', 'Pueblo Libre', 'Barranco', 'Chorrillos', 'San Miguel', 'Magdalena', 'Lince', 'Breña', 'Cercado de Lima', 'Ate', 'San Juan de Lurigancho', 'Comas', 'Los Olivos', 'Independencia', 'Villa El Salvador', 'Villa María del Triunfo', 'San Martín de Porres'] },
  { city: 'Chosica', region: 'Lima', lat: -11.9437, lon: -76.7094, districts: ['Chosica', 'Ñaña', 'Santa Eulalia', 'Ricardo Palma', 'Jicamarca', 'Huachipa', 'Carapongo', 'Cajamarquilla'] },
  { city: 'Callao', region: 'Callao', lat: -12.0566, lon: -77.1181, districts: ['Callao', 'Bellavista', 'La Perla', 'La Punta', 'Ventanilla', 'Mi Perú', 'Carmen de la Legua'] },
  { city: 'Arequipa', region: 'Arequipa', lat: -16.4090, lon: -71.5375, districts: ['Cercado', 'Cayma', 'Cerro Colorado', 'Yanahuara', 'José Luis Bustamante', 'Socabaya', 'Paucarpata', 'Miraflores', 'Hunter'] },
  { city: 'Cusco', region: 'Cusco', lat: -13.5319, lon: -71.9675, districts: ['Cusco', 'Wanchaq', 'Santiago', 'San Sebastián', 'San Jerónimo', 'Saylla'] },
  { city: 'Trujillo', region: 'La Libertad', lat: -8.1116, lon: -79.0288, districts: ['Trujillo', 'Víctor Larco', 'La Esperanza', 'El Porvenir', 'Huanchaco', 'Moche'] },
  { city: 'Piura', region: 'Piura', lat: -5.1945, lon: -80.6328, districts: ['Piura', 'Castilla', 'Catacaos', 'Veintiséis de Octubre', 'Tambo Grande'] },
  { city: 'Chiclayo', region: 'Lambayeque', lat: -6.7714, lon: -79.8409, districts: ['Chiclayo', 'José Leonardo Ortiz', 'La Victoria', 'Pimentel', 'Monsefú'] },
  { city: 'Iquitos', region: 'Loreto', lat: -3.7437, lon: -73.2516, districts: ['Iquitos', 'Belén', 'Punchana', 'San Juan Bautista'] },
  { city: 'Huancayo', region: 'Junín', lat: -12.0651, lon: -75.2049, districts: ['Huancayo', 'El Tambo', 'Chilca', 'Pilcomayo'] },
  { city: 'Huaraz', region: 'Áncash', lat: -9.5278, lon: -77.5278, districts: ['Huaraz', 'Independencia', 'Jangas'] },
  { city: 'Puno', region: 'Puno', lat: -15.8402, lon: -70.0219, districts: ['Puno', 'Ácora', 'Chucuito'] },
  { city: 'Tacna', region: 'Tacna', lat: -18.0146, lon: -70.2536, districts: ['Tacna', 'Alto de la Alianza', 'Ciudad Nueva', 'Pocollay'] },
  { city: 'Ica', region: 'Ica', lat: -14.0678, lon: -75.7286, districts: ['Ica', 'La Tinguiña', 'Parcona', 'Subtanjalla'] },
  { city: 'Juliaca', region: 'Puno', lat: -15.4997, lon: -70.1333, districts: ['Juliaca', 'San Miguel'] },
  { city: 'Cajamarca', region: 'Cajamarca', lat: -7.1617, lon: -78.5128, districts: ['Cajamarca', 'Baños del Inca', 'Los Baños'] },
  { city: 'Ayacucho', region: 'Ayacucho', lat: -13.1639, lon: -74.2236, districts: ['Ayacucho', 'Carmen Alto', 'San Juan Bautista'] },
  { city: 'Pucallpa', region: 'Ucayali', lat: -8.3791, lon: -74.5539, districts: ['Callería', 'Yarinacocha', 'Manantay'] },
  { city: 'Tarapoto', region: 'San Martín', lat: -6.4880, lon: -76.3728, districts: ['Tarapoto', 'La Banda de Shilcayo', 'Morales'] },
  { city: 'Huánuco', region: 'Huánuco', lat: -9.9306, lon: -76.2422, districts: ['Huánuco', 'Pillco Marca', 'Amarilis'] },
  { city: 'Chincha Alta', region: 'Ica', lat: -13.4178, lon: -76.1325, districts: ['Chincha Alta', 'Pueblo Nuevo', 'Sunampe'] },
  { city: 'Sullana', region: 'Piura', lat: -4.9039, lon: -80.6853, districts: ['Sullana', 'Bellavista', 'Marcavelica'] },
  { city: 'Chimbote', region: 'Áncash', lat: -9.0853, lon: -78.5783, districts: ['Chimbote', 'Nuevo Chimbote'] },
  { city: 'Moquegua', region: 'Moquegua', lat: -17.1939, lon: -70.9346, districts: ['Moquegua', 'Samegua'] },
  { city: 'Tumbes', region: 'Tumbes', lat: -3.5669, lon: -80.4515, districts: ['Tumbes', 'Corrales', 'La Cruz'] }
];

export function findCity(name: string): PeruCity | undefined {
  const n = name.trim().toLowerCase();
  return PERU_CITIES.find((c) => c.city.toLowerCase() === n);
}

export function validateLocation(city: string, district?: string): {
  ok: boolean;
  city?: PeruCity;
  districtOk: boolean;
  message: string;
} {
  const c = findCity(city);
  if (!c) {
    return {
      ok: false,
      districtOk: false,
      message: `Ciudad «${city}» no está en el catálogo MARU. Elige una ciudad conocida o verifica el nombre.`
    };
  }
  if (!district?.trim()) {
    return { ok: true, city: c, districtOk: true, message: `Ciudad válida: ${c.city} (${c.region}).` };
  }
  const dOk = c.districts.some((d) => d.toLowerCase() === district.trim().toLowerCase());
  return {
    ok: true,
    city: c,
    districtOk: dOk,
    message: dOk
      ? `Ubicación validada: ${district}, ${c.city}.`
      : `Distrito «${district}» no figura en ${c.city}. Distritos conocidos: ${c.districts.slice(0, 6).join(', ')}…`
  };
}
