const logger = require('../../utils/logger');

class FinancialDictionary {
  constructor() {
    this.terms = this.initializeTerms();
    this.synonyms = this.initializeSynonyms();
    this.categories = this.initializeCategories();
  }

  initializeTerms() {
    return {
      // Basic Financial Terms
      'anggaran': {
        definition: 'Rencana keuangan untuk periode tertentu',
        examples: ['anggaran bulanan', 'anggaran tahunan'],
        related: ['budget', 'perencanaan']
      },
      'tabungan': {
        definition: 'Uang yang disimpan untuk keperluan masa depan',
        examples: ['tabungan pendidikan', 'tabungan pensiun'],
        related: ['saving', 'deposito']
      },
      'investasi': {
        definition: 'Penanaman modal untuk mendapatkan keuntungan di masa depan',
        examples: ['investasi saham', 'investasi properti'],
        related: ['reksadana', 'obligasi']
      },
      'utang': {
        definition: 'Kewajiban finansial yang harus dibayar',
        examples: ['utang kartu kredit', 'utang KPR'],
        related: ['pinjaman', 'cicilan']
      },

      // Transaction Terms
      'pemasukan': {
        definition: 'Uang yang diterima dari berbagai sumber',
        examples: ['gaji', 'bonus', 'pendapatan sampingan'],
        related: ['income', 'pendapatan']
      },
      'pengeluaran': {
        definition: 'Uang yang digunakan untuk berbagai keperluan',
        examples: ['biaya makan', 'transportasi', 'belanja'],
        related: ['expense', 'biaya']
      },
      'saldo': {
        definition: 'Jumlah uang yang tersedia',
        examples: ['saldo rekening', 'saldo e-wallet'],
        related: ['balance', 'dana']
      },
      'transfer': {
        definition: 'Pengiriman uang dari satu akun ke akun lain',
        examples: ['transfer antar bank', 'transfer e-wallet'],
        related: ['kirim uang', 'TF']
      },

      // Investment Terms
      'saham': {
        definition: 'Bukti kepemilikan bagian perusahaan',
        examples: ['saham blue chip', 'saham growth'],
        related: ['stock', 'equity']
      },
      'reksadana': {
        definition: 'Wadah investasi kolektif yang dikelola manajer investasi',
        examples: ['reksadana saham', 'reksadana pasar uang'],
        related: ['mutual fund', 'investasi']
      },
      'obligasi': {
        definition: 'Surat utang yang dapat diperdagangkan',
        examples: ['obligasi pemerintah', 'obligasi korporasi'],
        related: ['bond', 'surat utang']
      },
      'deposito': {
        definition: 'Simpanan berjangka dengan bunga tetap',
        examples: ['deposito 1 bulan', 'deposito 1 tahun'],
        related: ['time deposit', 'simpanan']
      },

      // Financial Planning Terms
      'dana_darurat': {
        definition: 'Dana yang disiapkan untuk keadaan tidak terduga',
        examples: ['dana darurat 6 bulan', 'emergency fund'],
        related: ['simpanan', 'cadangan']
      },
      'asuransi': {
        definition: 'Perlindungan finansial terhadap risiko',
        examples: ['asuransi jiwa', 'asuransi kesehatan'],
        related: ['insurance', 'proteksi']
      },
      'pensiun': {
        definition: 'Dana yang disiapkan untuk masa pensiun',
        examples: ['dana pensiun', 'tabungan hari tua'],
        related: ['retirement', 'jaminan hari tua']
      },
      'pajak': {
        definition: 'Kewajiban finansial kepada negara',
        examples: ['pajak penghasilan', 'pajak properti'],
        related: ['tax', 'PPh', 'PPN']
      }
    };
  }

  initializeSynonyms() {
    return {
      // Income Synonyms
      'pemasukan': ['pendapatan', 'income', 'gaji', 'penghasilan', 'masukan'],
      'gaji': ['salary', 'upah', 'bayaran', 'pendapatan tetap'],
      'bonus': ['insentif', 'tambahan', 'reward', 'komisi'],

      // Expense Synonyms
      'pengeluaran': ['biaya', 'expense', 'cost', 'pembayaran', 'belanja'],
      'tagihan': ['bill', 'invoice', 'pembayaran', 'kewajiban'],
      'belanja': ['shopping', 'pembelian', 'konsumsi'],

      // Saving Synonyms
      'tabungan': ['saving', 'simpanan', 'deposito', 'dana'],
      'menabung': ['menyimpan', 'saving', 'investasi', 'mengumpulkan'],
      'celengan': ['tabungan', 'saving box', 'tempat nabung'],

      // Investment Synonyms
      'investasi': ['penanaman modal', 'investment', 'tabungan masa depan'],
      'saham': ['stock', 'equity', 'kepemilikan perusahaan'],
      'reksadana': ['mutual fund', 'investasi kolektif'],

      // Debt Synonyms
      'utang': ['pinjaman', 'kredit', 'debt', 'loan', 'kewajiban'],
      'cicilan': ['angsuran', 'installment', 'pembayaran berkala'],
      'KPR': ['kredit rumah', 'mortgage', 'housing loan'],

      // Budget Synonyms
      'anggaran': ['budget', 'rencana keuangan', 'alokasi dana'],
      'alokasi': ['pembagian', 'distribusi', 'penempatan dana'],
      'target': ['goal', 'tujuan', 'rencana']
    };
  }

  initializeCategories() {
    return {
      'pengeluaran_rutin': [
        'makan',
        'transportasi',
        'utilities',
        'internet',
        'pulsa',
        'sewa',
        'cicilan'
      ],
      'pengeluaran_non_rutin': [
        'belanja',
        'hiburan',
        'kesehatan',
        'pendidikan',
        'liburan',
        'hadiah'
      ],
      'pemasukan_rutin': [
        'gaji',
        'pension',
        'sewa',
        'dividen'
      ],
      'pemasukan_non_rutin': [
        'bonus',
        'komisi',
        'freelance',
        'hadiah',
        'warisan'
      ],
      'investasi': [
        'saham',
        'reksadana',
        'obligasi',
        'deposito',
        'properti',
        'emas'
      ],
      'utang': [
        'kartu_kredit',
        'KPR',
        'KTA',
        'pinjaman_online',
        'cicilan'
      ]
    };
  }

  // Get term definition and related information
  getTerm(term) {
    const normalizedTerm = term.toLowerCase();
    return this.terms[normalizedTerm] || null;
  }

  // Get synonyms for a term
  getSynonyms(term) {
    const normalizedTerm = term.toLowerCase();
    return this.synonyms[normalizedTerm] || [];
  }

  // Get category for a term
  getCategory(term) {
    const normalizedTerm = term.toLowerCase();
    for (const [category, terms] of Object.entries(this.categories)) {
      if (terms.includes(normalizedTerm)) {
        return category;
      }
    }
    return null;
  }

  // Find terms by category
  getTermsByCategory(category) {
    return this.categories[category] || [];
  }

  // Search for terms
  searchTerms(query) {
    const normalizedQuery = query.toLowerCase();
    const results = [];

    // Search in terms
    for (const [term, info] of Object.entries(this.terms)) {
      if (term.includes(normalizedQuery) || 
          info.definition.toLowerCase().includes(normalizedQuery) ||
          info.examples.some(ex => ex.toLowerCase().includes(normalizedQuery)) ||
          info.related.some(rel => rel.toLowerCase().includes(normalizedQuery))) {
        results.push({
          term,
          ...info
        });
      }
    }

    return results;
  }

  // Get suggestions for similar terms
  getSuggestions(term, limit = 5) {
    const normalizedTerm = term.toLowerCase();
    const scores = [];

    // Check all terms and their synonyms
    for (const [dictTerm, info] of Object.entries(this.terms)) {
      const similarity = this.calculateSimilarity(normalizedTerm, dictTerm);
      if (similarity > 0.3) {
        scores.push({
          term: dictTerm,
          similarity,
          info
        });
      }

      // Check synonyms
      const synonyms = this.getSynonyms(dictTerm);
      for (const synonym of synonyms) {
        const synSimilarity = this.calculateSimilarity(normalizedTerm, synonym);
        if (synSimilarity > 0.3) {
          scores.push({
            term: synonym,
            similarity: synSimilarity,
            info
          });
        }
      }
    }

    return scores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  // Calculate similarity between two terms using Levenshtein distance
  calculateSimilarity(term1, term2) {
    const matrix = [];
    const len1 = term1.length;
    const len2 = term2.length;

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (term1[i - 1] === term2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLength = Math.max(len1, len2);
    return 1 - matrix[len1][len2] / maxLength;
  }

  // Add new term to dictionary
  addTerm(term, definition, examples = [], related = []) {
    try {
      const normalizedTerm = term.toLowerCase();
      this.terms[normalizedTerm] = {
        definition,
        examples,
        related
      };
      logger.info(`Added new term to dictionary: ${term}`);
      return true;
    } catch (error) {
      logger.error('Error adding term to dictionary:', error);
      return false;
    }
  }

  // Add new synonyms for a term
  addSynonyms(term, newSynonyms) {
    try {
      const normalizedTerm = term.toLowerCase();
      if (!this.synonyms[normalizedTerm]) {
        this.synonyms[normalizedTerm] = [];
      }
      this.synonyms[normalizedTerm].push(...newSynonyms);
      logger.info(`Added new synonyms for term: ${term}`);
      return true;
    } catch (error) {
      logger.error('Error adding synonyms:', error);
      return false;
    }
  }
}

module.exports = new FinancialDictionary();
