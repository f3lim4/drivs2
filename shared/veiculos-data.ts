/**
 * Dados de marcas e modelos de veículos
 * Organizados por marca com seus respectivos modelos
 */

export interface ModeloVeiculo {
  nome: string;
  categoria: 'Hatch' | 'Sedan' | 'SUV' | 'Pickup' | 'Van' | 'Coupe' | 'Conversível' | 'Utilitário';
}

export interface MarcaVeiculo {
  nome: string;
  modelos: ModeloVeiculo[];
}

export const marcasVeiculos: MarcaVeiculo[] = [
  {
    nome: "Chevrolet",
    modelos: [
      { nome: "Onix", categoria: "Hatch" },
      { nome: "Prisma", categoria: "Sedan" },
      { nome: "Cruze", categoria: "Sedan" },
      { nome: "Tracker", categoria: "SUV" },
      { nome: "Equinox", categoria: "SUV" },
      { nome: "S10", categoria: "Pickup" },
      { nome: "Spin", categoria: "Van" },
      { nome: "Cobalt", categoria: "Sedan" },
      { nome: "Celta", categoria: "Hatch" },
      { nome: "Corsa", categoria: "Hatch" }
    ]
  },
  {
    nome: "Volkswagen",
    modelos: [
      { nome: "Gol", categoria: "Hatch" },
      { nome: "Polo", categoria: "Hatch" },
      { nome: "Virtus", categoria: "Sedan" },
      { nome: "Jetta", categoria: "Sedan" },
      { nome: "T-Cross", categoria: "SUV" },
      { nome: "Tiguan", categoria: "SUV" },
      { nome: "Amarok", categoria: "Pickup" },
      { nome: "Fox", categoria: "Hatch" },
      { nome: "Voyage", categoria: "Sedan" },
      { nome: "Up!", categoria: "Hatch" }
    ]
  },
  {
    nome: "Ford",
    modelos: [
      { nome: "Ka", categoria: "Hatch" },
      { nome: "Focus", categoria: "Hatch" },
      { nome: "Fusion", categoria: "Sedan" },
      { nome: "EcoSport", categoria: "SUV" },
      { nome: "Territory", categoria: "SUV" },
      { nome: "Ranger", categoria: "Pickup" },
      { nome: "Fiesta", categoria: "Hatch" },
      { nome: "Edge", categoria: "SUV" },
      { nome: "Mustang", categoria: "Coupe" }
    ]
  },
  {
    nome: "Fiat",
    modelos: [
      { nome: "Uno", categoria: "Hatch" },
      { nome: "Argo", categoria: "Hatch" },
      { nome: "Cronos", categoria: "Sedan" },
      { nome: "Mobi", categoria: "Hatch" },
      { nome: "Toro", categoria: "Pickup" },
      { nome: "Pulse", categoria: "SUV" },
      { nome: "Fastback", categoria: "SUV" },
      { nome: "Strada", categoria: "Pickup" },
      { nome: "Doblo", categoria: "Van" },
      { nome: "Palio", categoria: "Hatch" }
    ]
  },
  {
    nome: "Hyundai",
    modelos: [
      { nome: "HB20", categoria: "Hatch" },
      { nome: "HB20S", categoria: "Sedan" },
      { nome: "Creta", categoria: "SUV" },
      { nome: "Tucson", categoria: "SUV" },
      { nome: "Santa Fe", categoria: "SUV" },
      { nome: "Elantra", categoria: "Sedan" },
      { nome: "Azera", categoria: "Sedan" },
      { nome: "ix35", categoria: "SUV" },
      { nome: "Veloster", categoria: "Coupe" }
    ]
  },
  {
    nome: "Toyota",
    modelos: [
      { nome: "Etios", categoria: "Hatch" },
      { nome: "Etios Sedan", categoria: "Sedan" },
      { nome: "Yaris", categoria: "Hatch" },
      { nome: "Corolla", categoria: "Sedan" },
      { nome: "RAV4", categoria: "SUV" },
      { nome: "Hilux", categoria: "Pickup" },
      { nome: "SW4", categoria: "SUV" },
      { nome: "Prius", categoria: "Sedan" },
      { nome: "Camry", categoria: "Sedan" }
    ]
  },
  {
    nome: "Honda",
    modelos: [
      { nome: "Fit", categoria: "Hatch" },
      { nome: "City", categoria: "Sedan" },
      { nome: "Civic", categoria: "Sedan" },
      { nome: "HR-V", categoria: "SUV" },
      { nome: "CR-V", categoria: "SUV" },
      { nome: "Accord", categoria: "Sedan" },
      { nome: "WR-V", categoria: "SUV" }
    ]
  },
  {
    nome: "Nissan",
    modelos: [
      { nome: "March", categoria: "Hatch" },
      { nome: "Versa", categoria: "Sedan" },
      { nome: "Kicks", categoria: "SUV" },
      { nome: "X-Trail", categoria: "SUV" },
      { nome: "Frontier", categoria: "Pickup" },
      { nome: "Sentra", categoria: "Sedan" },
      { nome: "Altima", categoria: "Sedan" }
    ]
  },
  {
    nome: "Renault",
    modelos: [
      { nome: "Kwid", categoria: "Hatch" },
      { nome: "Logan", categoria: "Sedan" },
      { nome: "Sandero", categoria: "Hatch" },
      { nome: "Duster", categoria: "SUV" },
      { nome: "Captur", categoria: "SUV" },
      { nome: "Oroch", categoria: "Pickup" },
      { nome: "Fluence", categoria: "Sedan" }
    ]
  },
  {
    nome: "Peugeot",
    modelos: [
      { nome: "208", categoria: "Hatch" },
      { nome: "2008", categoria: "SUV" },
      { nome: "3008", categoria: "SUV" },
      { nome: "5008", categoria: "SUV" },
      { nome: "207", categoria: "Hatch" },
      { nome: "307", categoria: "Hatch" },
      { nome: "408", categoria: "Sedan" }
    ]
  },
  {
    nome: "Citroën",
    modelos: [
      { nome: "C3", categoria: "Hatch" },
      { nome: "C4 Cactus", categoria: "SUV" },
      { nome: "Aircross", categoria: "SUV" },
      { nome: "C4 Lounge", categoria: "Sedan" }
    ]
  },
  {
    nome: "Jeep",
    modelos: [
      { nome: "Renegade", categoria: "SUV" },
      { nome: "Compass", categoria: "SUV" },
      { nome: "Cherokee", categoria: "SUV" },
      { nome: "Grand Cherokee", categoria: "SUV" },
      { nome: "Wrangler", categoria: "SUV" }
    ]
  },
  {
    nome: "Mitsubishi",
    modelos: [
      { nome: "Lancer", categoria: "Sedan" },
      { nome: "ASX", categoria: "SUV" },
      { nome: "Outlander", categoria: "SUV" },
      { nome: "Pajero", categoria: "SUV" },
      { nome: "L200", categoria: "Pickup" }
    ]
  },
  {
    nome: "Suzuki",
    modelos: [
      { nome: "Jimny", categoria: "SUV" },
      { nome: "Vitara", categoria: "SUV" },
      { nome: "Swift", categoria: "Hatch" }
    ]
  },
  {
    nome: "Subaru",
    modelos: [
      { nome: "Impreza", categoria: "Sedan" },
      { nome: "XV", categoria: "SUV" },
      { nome: "Outback", categoria: "SUV" },
      { nome: "Forester", categoria: "SUV" },
      { nome: "Legacy", categoria: "Sedan" },
      { nome: "BRZ", categoria: "Coupe" }
    ]
  },
  {
    nome: "BMW",
    modelos: [
      { nome: "320i", categoria: "Sedan" },
      { nome: "X1", categoria: "SUV" },
      { nome: "X3", categoria: "SUV" },
      { nome: "X5", categoria: "SUV" },
      { nome: "X6", categoria: "SUV" },
      { nome: "118i", categoria: "Hatch" },
      { nome: "328i", categoria: "Sedan" },
      { nome: "530i", categoria: "Sedan" },
      { nome: "Z4", categoria: "Conversível" }
    ]
  },
  {
    nome: "Mercedes-Benz",
    modelos: [
      { nome: "A 200", categoria: "Hatch" },
      { nome: "C 180", categoria: "Sedan" },
      { nome: "C 200", categoria: "Sedan" },
      { nome: "E 250", categoria: "Sedan" },
      { nome: "GLA 200", categoria: "SUV" },
      { nome: "GLC 250", categoria: "SUV" },
      { nome: "GLE 350", categoria: "SUV" },
      { nome: "CLA 200", categoria: "Sedan" },
      { nome: "SLK 200", categoria: "Conversível" }
    ]
  },
  {
    nome: "Audi",
    modelos: [
      { nome: "A1", categoria: "Hatch" },
      { nome: "A3", categoria: "Sedan" },
      { nome: "A4", categoria: "Sedan" },
      { nome: "A6", categoria: "Sedan" },
      { nome: "Q3", categoria: "SUV" },
      { nome: "Q5", categoria: "SUV" },
      { nome: "Q7", categoria: "SUV" },
      { nome: "TT", categoria: "Coupe" },
      { nome: "R8", categoria: "Coupe" }
    ]
  },
  {
    nome: "Land Rover",
    modelos: [
      { nome: "Discovery Sport", categoria: "SUV" },
      { nome: "Range Rover Evoque", categoria: "SUV" },
      { nome: "Range Rover Sport", categoria: "SUV" },
      { nome: "Range Rover Vogue", categoria: "SUV" },
      { nome: "Freelander 2", categoria: "SUV" },
      { nome: "Discovery 4", categoria: "SUV" }
    ]
  },
  {
    nome: "Volvo",
    modelos: [
      { nome: "XC60", categoria: "SUV" },
      { nome: "XC90", categoria: "SUV" },
      { nome: "S60", categoria: "Sedan" },
      { nome: "V40", categoria: "Hatch" },
      { nome: "XC40", categoria: "SUV" },
      { nome: "S90", categoria: "Sedan" }
    ]
  },
  {
    nome: "Kia",
    modelos: [
      { nome: "Picanto", categoria: "Hatch" },
      { nome: "Rio", categoria: "Hatch" },
      { nome: "Cerato", categoria: "Sedan" },
      { nome: "Optima", categoria: "Sedan" },
      { nome: "Sportage", categoria: "SUV" },
      { nome: "Sorento", categoria: "SUV" },
      { nome: "Soul", categoria: "Hatch" },
      { nome: "Stinger", categoria: "Sedan" }
    ]
  },
  {
    nome: "JAC",
    modelos: [
      { nome: "J2", categoria: "Hatch" },
      { nome: "J3", categoria: "Sedan" },
      { nome: "J5", categoria: "Sedan" },
      { nome: "J6", categoria: "Sedan" },
      { nome: "T40", categoria: "SUV" },
      { nome: "T50", categoria: "SUV" },
      { nome: "T60", categoria: "SUV" }
    ]
  },
  {
    nome: "Chery",
    modelos: [
      { nome: "QQ", categoria: "Hatch" },
      { nome: "Celer", categoria: "Sedan" },
      { nome: "Tiggo 2", categoria: "SUV" },
      { nome: "Tiggo 5X", categoria: "SUV" },
      { nome: "Tiggo 7", categoria: "SUV" },
      { nome: "Arrizo 5", categoria: "Sedan" }
    ]
  },
  {
    nome: "Caoa Chery",
    modelos: [
      { nome: "Tiggo 2", categoria: "SUV" },
      { nome: "Tiggo 5X", categoria: "SUV" },
      { nome: "Tiggo 7", categoria: "SUV" },
      { nome: "Tiggo 8", categoria: "SUV" },
      { nome: "Arrizo 5", categoria: "Sedan" },
      { nome: "Arrizo 6", categoria: "Sedan" }
    ]
  },
  {
    nome: "Lifan",
    modelos: [
      { nome: "320", categoria: "Sedan" },
      { nome: "530", categoria: "Sedan" },
      { nome: "620", categoria: "Sedan" },
      { nome: "X60", categoria: "SUV" },
      { nome: "X80", categoria: "SUV" }
    ]
  },
  {
    nome: "Great Wall",
    modelos: [
      { nome: "Haval H6", categoria: "SUV" },
      { nome: "Haval H2", categoria: "SUV" },
      { nome: "Wingle 5", categoria: "Pickup" },
      { nome: "Wingle 6", categoria: "Pickup" }
    ]
  },
  {
    nome: "Mini",
    modelos: [
      { nome: "Cooper", categoria: "Hatch" },
      { nome: "Cooper S", categoria: "Hatch" },
      { nome: "Clubman", categoria: "Hatch" },
      { nome: "Countryman", categoria: "SUV" },
      { nome: "Cabrio", categoria: "Conversível" }
    ]
  },
  {
    nome: "Smart",
    modelos: [
      { nome: "Fortwo", categoria: "Hatch" },
      { nome: "Forfour", categoria: "Hatch" }
    ]
  },
  {
    nome: "Porsche",
    modelos: [
      { nome: "911", categoria: "Coupe" },
      { nome: "Cayenne", categoria: "SUV" },
      { nome: "Macan", categoria: "SUV" },
      { nome: "Panamera", categoria: "Sedan" },
      { nome: "Boxster", categoria: "Conversível" },
      { nome: "Cayman", categoria: "Coupe" }
    ]
  },
  {
    nome: "Maserati",
    modelos: [
      { nome: "Ghibli", categoria: "Sedan" },
      { nome: "Quattroporte", categoria: "Sedan" },
      { nome: "Levante", categoria: "SUV" },
      { nome: "GranTurismo", categoria: "Coupe" }
    ]
  },
  {
    nome: "Ferrari",
    modelos: [
      { nome: "458 Italia", categoria: "Coupe" },
      { nome: "488 GTB", categoria: "Coupe" },
      { nome: "California", categoria: "Conversível" },
      { nome: "F12", categoria: "Coupe" }
    ]
  },
  {
    nome: "Lamborghini",
    modelos: [
      { nome: "Huracán", categoria: "Coupe" },
      { nome: "Aventador", categoria: "Coupe" },
      { nome: "Urus", categoria: "SUV" }
    ]
  },
  {
    nome: "Alfa Romeo",
    modelos: [
      { nome: "Giulia", categoria: "Sedan" },
      { nome: "Stelvio", categoria: "SUV" },
      { nome: "4C", categoria: "Coupe" }
    ]
  },
  {
    nome: "Jaguar",
    modelos: [
      { nome: "XE", categoria: "Sedan" },
      { nome: "XF", categoria: "Sedan" },
      { nome: "XJ", categoria: "Sedan" },
      { nome: "F-Pace", categoria: "SUV" },
      { nome: "E-Pace", categoria: "SUV" },
      { nome: "F-Type", categoria: "Coupe" }
    ]
  },
  {
    nome: "Lexus",
    modelos: [
      { nome: "IS 250", categoria: "Sedan" },
      { nome: "ES 350", categoria: "Sedan" },
      { nome: "RX 350", categoria: "SUV" },
      { nome: "NX 200t", categoria: "SUV" },
      { nome: "LX 570", categoria: "SUV" }
    ]
  },
  {
    nome: "Infiniti",
    modelos: [
      { nome: "Q50", categoria: "Sedan" },
      { nome: "QX50", categoria: "SUV" },
      { nome: "QX60", categoria: "SUV" },
      { nome: "QX70", categoria: "SUV" }
    ]
  },
  {
    nome: "Acura",
    modelos: [
      { nome: "TLX", categoria: "Sedan" },
      { nome: "MDX", categoria: "SUV" },
      { nome: "RDX", categoria: "SUV" },
      { nome: "NSX", categoria: "Coupe" }
    ]
  },
  {
    nome: "Genesis",
    modelos: [
      { nome: "G70", categoria: "Sedan" },
      { nome: "G80", categoria: "Sedan" },
      { nome: "G90", categoria: "Sedan" },
      { nome: "GV70", categoria: "SUV" },
      { nome: "GV80", categoria: "SUV" }
    ]
  },
  {
    nome: "Tesla",
    modelos: [
      { nome: "Model S", categoria: "Sedan" },
      { nome: "Model 3", categoria: "Sedan" },
      { nome: "Model X", categoria: "SUV" },
      { nome: "Model Y", categoria: "SUV" }
    ]
  },
  {
    nome: "BYD",
    modelos: [
      { nome: "Song", categoria: "SUV" },
      { nome: "Tang", categoria: "SUV" },
      { nome: "Han", categoria: "Sedan" },
      { nome: "Dolphin", categoria: "Hatch" },
      { nome: "Seal", categoria: "Sedan" }
    ]
  },
  {
    nome: "GWM",
    modelos: [
      { nome: "Haval H6", categoria: "SUV" },
      { nome: "Ora 03", categoria: "Hatch" },
      { nome: "Poer", categoria: "Pickup" }
    ]
  }
];

// Função para obter modelos de uma marca específica
export const getModelosPorMarca = (marcaNome: string): ModeloVeiculo[] => {
  const marca = marcasVeiculos.find(m => m.nome.toLowerCase() === marcaNome.toLowerCase());
  return marca ? marca.modelos : [];
};

// Função para obter todas as marcas
export const getMarcas = (): string[] => {
  return marcasVeiculos.map(marca => marca.nome);
};

// Função para buscar modelos por termo
export const buscarModelos = (termo: string): { marca: string; modelo: ModeloVeiculo }[] => {
  const resultados: { marca: string; modelo: ModeloVeiculo }[] = [];
  
  marcasVeiculos.forEach(marca => {
    marca.modelos.forEach(modelo => {
      if (modelo.nome.toLowerCase().includes(termo.toLowerCase()) ||
          marca.nome.toLowerCase().includes(termo.toLowerCase())) {
        resultados.push({ marca: marca.nome, modelo });
      }
    });
  });
  
  return resultados;
};