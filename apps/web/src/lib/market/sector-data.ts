/**
 * Curated sector/industry mapping for B3 tickers.
 *
 * This is a manually maintained map — extend it as new tickers are needed.
 * Used on the asset detail page to display sector info and find related assets.
 */
export const TICKER_SECTOR_MAP: Record<string, { sector: string; industry: string }> = {
  // Petróleo e Gás
  PETR4: { sector: 'Petróleo e Gás', industry: 'Exploração e Produção' },
  PETR3: { sector: 'Petróleo e Gás', industry: 'Exploração e Produção' },
  PRIO3: { sector: 'Petróleo e Gás', industry: 'Exploração e Produção' },
  RRRP3: { sector: 'Petróleo e Gás', industry: 'Exploração e Produção' },
  UGPA3: { sector: 'Petróleo e Gás', industry: 'Distribuição' },
  CSAN3: { sector: 'Petróleo e Gás', industry: 'Distribuição' },

  // Materiais Básicos
  VALE3: { sector: 'Materiais Básicos', industry: 'Mineração' },
  CMIN3: { sector: 'Materiais Básicos', industry: 'Mineração' },
  BRAP4: { sector: 'Materiais Básicos', industry: 'Mineração' },
  GGBR4: { sector: 'Materiais Básicos', industry: 'Siderurgia' },
  CSNA3: { sector: 'Materiais Básicos', industry: 'Siderurgia' },
  USIM5: { sector: 'Materiais Básicos', industry: 'Siderurgia' },
  GOAU4: { sector: 'Materiais Básicos', industry: 'Siderurgia' },
  KLBN11: { sector: 'Materiais Básicos', industry: 'Papel e Celulose' },
  SUZB3: { sector: 'Materiais Básicos', industry: 'Papel e Celulose' },
  BRKM5: { sector: 'Materiais Básicos', industry: 'Petroquímica' },
  UNIP6: { sector: 'Materiais Básicos', industry: 'Petroquímica' },
  RANI3: { sector: 'Materiais Básicos', industry: 'Óleo e Gorduras' },

  // Financeiro
  ITUB4: { sector: 'Financeiro', industry: 'Banco Múltiplo' },
  ITUB3: { sector: 'Financeiro', industry: 'Banco Múltiplo' },
  BBDC4: { sector: 'Financeiro', industry: 'Banco Múltiplo' },
  BBDC3: { sector: 'Financeiro', industry: 'Banco Múltiplo' },
  BBAS3: { sector: 'Financeiro', industry: 'Banco Múltiplo' },
  SANB11: { sector: 'Financeiro', industry: 'Banco Múltiplo' },
  SANB4: { sector: 'Financeiro', industry: 'Banco Múltiplo' },
  BPAC11: { sector: 'Financeiro', industry: 'Banco de Investimento' },
  BPAC5: { sector: 'Financeiro', industry: 'Banco de Investimento' },
  BBPO11: { sector: 'Financeiro', industry: 'Banco de Investimento' },
  B3SA3: { sector: 'Financeiro', industry: 'Bolsa e Infraestrutura' },
  XPBR31: { sector: 'Financeiro', industry: 'Corretora' },
  IRBR3: { sector: 'Financeiro', industry: 'Resseguros' },
  PSSA3: { sector: 'Financeiro', industry: 'Seguros' },
  CXSE3: { sector: 'Financeiro', industry: 'Seguros' },

  // Consumo Não Cíclico
  ABEV3: { sector: 'Consumo Não Cíclico', industry: 'Bebidas' },
  AMBEV: { sector: 'Consumo Não Cíclico', industry: 'Bebidas' },
  JBSS3: { sector: 'Consumo Não Cíclico', industry: 'Alimentos' },
  MRFG3: { sector: 'Consumo Não Cíclico', industry: 'Alimentos' },
  BRFS3: { sector: 'Consumo Não Cíclico', industry: 'Alimentos' },
  BEEF3: { sector: 'Consumo Não Cíclico', industry: 'Alimentos' },
  SMTO3: { sector: 'Consumo Não Cíclico', industry: 'Alimentos' },
  COGN3: { sector: 'Consumo Não Cíclico', industry: 'Educação' },
  YDUQ3: { sector: 'Consumo Não Cíclico', industry: 'Educação' },
  SEER3: { sector: 'Consumo Não Cíclico', industry: 'Educação' },
  RADL3: { sector: 'Consumo Não Cíclico', industry: 'Saúde' },
  DASA3: { sector: 'Consumo Não Cíclico', industry: 'Saúde' },
  HAPV3: { sector: 'Consumo Não Cíclico', industry: 'Saúde' },
  FLRY3: { sector: 'Consumo Não Cíclico', industry: 'Saúde' },
  QUAL3: { sector: 'Consumo Não Cíclico', industry: 'Saúde' },
  GMAT3: { sector: 'Consumo Não Cíclico', industry: 'Varejo Alimentar' },
  PCAR3: { sector: 'Consumo Não Cíclico', industry: 'Varejo Alimentar' },
  CRFB3: { sector: 'Consumo Não Cíclico', industry: 'Varejo Alimentar' },

  // Consumo Cíclico
  RENT3: { sector: 'Consumo Cíclico', industry: 'Aluguel de Carros' },
  LREN3: { sector: 'Consumo Cíclico', industry: 'Varejo de Moda' },
  ALPK3: { sector: 'Consumo Cíclico', industry: 'Varejo de Moda' },
  SOMA3: { sector: 'Consumo Cíclico', industry: 'Varejo de Moda' },
  AMAR3: { sector: 'Consumo Cíclico', industry: 'Varejo de Moda' },
  MGLU3: { sector: 'Consumo Cíclico', industry: 'E-commerce' },
  BHIA3: { sector: 'Consumo Cíclico', industry: 'E-commerce' },
  CVCB3: { sector: 'Consumo Cíclico', industry: 'Turismo' },
  EZTC3: { sector: 'Consumo Cíclico', industry: 'Incorporação' },
  CYRE3: { sector: 'Consumo Cíclico', industry: 'Incorporação' },
  MRVE3: { sector: 'Consumo Cíclico', industry: 'Incorporação' },
  DIRR3: { sector: 'Consumo Cíclico', industry: 'Incorporação' },
  TEND3: { sector: 'Consumo Cíclico', industry: 'Incorporação' },
  MULT3: { sector: 'Consumo Cíclico', industry: 'Shopping Centers' },
  IGTI11: { sector: 'Consumo Cíclico', industry: 'Shopping Centers' },
  MCEL3: { sector: 'Consumo Cíclico', industry: 'Eletroeletrônicos' },
  WHRL4: { sector: 'Consumo Cíclico', industry: 'Eletroeletrônicos' },
  AZUL4: { sector: 'Consumo Cíclico', industry: 'Aviação' },
  GOLL4: { sector: 'Consumo Cíclico', industry: 'Aviação' },

  // Bens Industriais
  WEGE3: { sector: 'Bens Industriais', industry: 'Máquinas e Equipamentos' },
  EMBR3: { sector: 'Bens Industriais', industry: 'Aeronáutica' },
  RAIZ4: { sector: 'Bens Industriais', industry: 'Logística' },
  RUMO3: { sector: 'Bens Industriais', industry: 'Logística' },
  CCRO3: { sector: 'Bens Industriais', industry: 'Concessão Rodoviária' },
  ECOR3: { sector: 'Bens Industriais', industry: 'Concessão Rodoviária' },
  STBP3: { sector: 'Bens Industriais', industry: 'Logística Portuária' },
  ARML3: { sector: 'Bens Industriais', industry: 'Material de Transporte' },
  TUPY3: { sector: 'Bens Industriais', industry: 'Material de Transporte' },
  MYPK3: { sector: 'Bens Industriais', industry: 'Embalagens' },
  KEPL3: { sector: 'Bens Industriais', industry: 'Embalagens' },

  // Utilidade Pública
  EGIE3: { sector: 'Utilidade Pública', industry: 'Energia Elétrica' },
  TAEE11: { sector: 'Utilidade Pública', industry: 'Transmissão de Energia' },
  TRPL4: { sector: 'Utilidade Pública', industry: 'Transmissão de Energia' },
  NEOE3: { sector: 'Utilidade Pública', industry: 'Energia Elétrica' },
  ENGI11: { sector: 'Utilidade Pública', industry: 'Energia Elétrica' },
  CMIG4: { sector: 'Utilidade Pública', industry: 'Energia Elétrica' },
  CESP6: { sector: 'Utilidade Pública', industry: 'Energia Elétrica' },
  CPLE6: { sector: 'Utilidade Pública', industry: 'Energia Elétrica' },
  ELET3: { sector: 'Utilidade Pública', industry: 'Energia Elétrica' },
  ELET6: { sector: 'Utilidade Pública', industry: 'Energia Elétrica' },
  SAPR11: { sector: 'Utilidade Pública', industry: 'Saneamento' },
  SBSP3: { sector: 'Utilidade Pública', industry: 'Saneamento' },
  CSMG3: { sector: 'Utilidade Pública', industry: 'Saneamento' },
  AURE3: { sector: 'Utilidade Pública', industry: 'Saneamento' },

  // Tecnologia
  TOTS3: { sector: 'Tecnologia', industry: 'Software' },
  LIGT3: { sector: 'Tecnologia', industry: 'Serviços de TI' },
  CASH3: { sector: 'Tecnologia', industry: 'Serviços de TI' },
  POSI3: { sector: 'Tecnologia', industry: 'Automação Comercial' },

  // Telecomunicações
  TIMS3: { sector: 'Telecomunicações', industry: 'Telefonia Móvel' },
  VIVT3: { sector: 'Telecomunicações', industry: 'Telefonia Fixa e Móvel' },
  OIBR3: { sector: 'Telecomunicações', industry: 'Telefonia Fixa' },
  TELB3: { sector: 'Telecomunicações', industry: 'Telefonia' },
};

// Icons mapped by sector for visual display
export const SECTOR_ICONS: Record<string, string> = {
  'Petróleo e Gás': 'local_gas_station',
  'Materiais Básicos': 'handyman',
  'Financeiro': 'account_balance',
  'Consumo Não Cíclico': 'restaurant',
  'Consumo Cíclico': 'shopping_bag',
  'Bens Industriais': 'precision_manufacturing',
  'Utilidade Pública': 'bolt',
  'Tecnologia': 'computer',
  'Telecomunicações': 'cell_tower',
  Saúde: 'local_hospital',
  Educacao: 'school',
};

/**
 * Get sector info for a ticker. Returns null if ticker is not in the curated map.
 */
export function getSectorInfo(ticker: string): { sector: string; industry: string } | null {
  const t = ticker.toUpperCase();
  return TICKER_SECTOR_MAP[t] ?? null;
}

/**
 * Get related tickers from the same sector (excluding the given ticker).
 */
export function getRelatedTickers(ticker: string, limit = 6): string[] {
  const info = getSectorInfo(ticker);
  if (!info) return [];
  return Object.entries(TICKER_SECTOR_MAP)
    .filter(([t, s]) => t !== ticker.toUpperCase() && s.sector === info.sector)
    .slice(0, limit)
    .map(([t]) => t);
}

/**
 * Get sector icon name for a given sector string.
 */
export function getSectorIcon(sector: string): string {
  return SECTOR_ICONS[sector] ?? 'category';
}
