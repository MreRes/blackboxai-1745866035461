const { NlpManager } = require('node-nlp');
const logger = require('../utils/logger');
const Transaction = require('../models/transaction.model');
const Budget = require('../models/budget.model');
const Goal = require('../models/goal.model');

class NLPHandler {
  constructor() {
    this.manager = new NlpManager({ languages: ['id'], forceNER: true });
    this.initializeNLP();
  }

  async initializeNLP() {
    try {
      // Add entities
      this.addEntities();
      // Add documents
      this.addDocuments();
      // Add answers
      this.addAnswers();
      // Train the model
      await this.manager.train();
      logger.info('NLP model trained successfully');
    } catch (error) {
      logger.error('Error initializing NLP:', error);
    }
  }

  addEntities() {
    // Currency amounts
    this.manager.addNamedEntityText('amount', 'currency', ['id'], [
      'ribu',
      'juta',
      'rupiah',
      'rp',
      'k',
      'm'
    ]);

    // Categories
    this.manager.addNamedEntityText('category', 'expense', ['id'], [
      'makan',
      'transportasi',
      'belanja',
      'kesehatan',
      'pendidikan',
      'hiburan',
      'utilitas',
      'investasi',
      'tabungan',
      'lainnya'
    ]);

    // Time periods
    this.manager.addNamedEntityText('period', 'time', ['id'], [
      'hari ini',
      'kemarin',
      'minggu ini',
      'bulan ini',
      'tahun ini',
      'minggu lalu',
      'bulan lalu',
      'tahun lalu'
    ]);
  }

  addDocuments() {
    // Transaction intents
    this.addTransactionDocuments();
    // Budget intents
    this.addBudgetDocuments();
    // Goal intents
    this.addGoalDocuments();
    // Report intents
    this.addReportDocuments();
    // Help intents
    this.addHelpDocuments();
  }

  addTransactionDocuments() {
    // Expense patterns
    this.manager.addDocument('id', 'catat pengeluaran * untuk *', 'transaction.expense');
    this.manager.addDocument('id', 'saya menghabiskan * untuk *', 'transaction.expense');
    this.manager.addDocument('id', 'bayar * sebesar *', 'transaction.expense');
    this.manager.addDocument('id', 'beli * seharga *', 'transaction.expense');
    this.manager.addDocument('id', 'keluar uang * buat *', 'transaction.expense');

    // Income patterns
    this.manager.addDocument('id', 'catat pemasukan * dari *', 'transaction.income');
    this.manager.addDocument('id', 'terima uang * dari *', 'transaction.income');
    this.manager.addDocument('id', 'dapat gaji *', 'transaction.income');
    this.manager.addDocument('id', 'masuk uang * dari *', 'transaction.income');
    
    // Transaction history
    this.manager.addDocument('id', 'lihat transaksi *', 'transaction.view');
    this.manager.addDocument('id', 'riwayat transaksi *', 'transaction.view');
    this.manager.addDocument('id', 'cek mutasi *', 'transaction.view');
  }

  addBudgetDocuments() {
    this.manager.addDocument('id', 'atur budget * sebesar *', 'budget.set');
    this.manager.addDocument('id', 'buat anggaran * untuk *', 'budget.set');
    this.manager.addDocument('id', 'tentukan budget * senilai *', 'budget.set');
    this.manager.addDocument('id', 'lihat budget', 'budget.view');
    this.manager.addDocument('id', 'cek anggaran', 'budget.view');
    this.manager.addDocument('id', 'sisa budget', 'budget.remaining');
  }

  addGoalDocuments() {
    this.manager.addDocument('id', 'buat target menabung *', 'goal.create');
    this.manager.addDocument('id', 'target keuangan * sebesar *', 'goal.create');
    this.manager.addDocument('id', 'rencana tabungan * untuk *', 'goal.create');
    this.manager.addDocument('id', 'lihat progress tabungan', 'goal.view');
    this.manager.addDocument('id', 'cek target menabung', 'goal.view');
  }

  addReportDocuments() {
    this.manager.addDocument('id', 'laporan keuangan', 'report.summary');
    this.manager.addDocument('id', 'ringkasan transaksi', 'report.transactions');
    this.manager.addDocument('id', 'analisis pengeluaran', 'report.expense.analysis');
    this.manager.addDocument('id', 'grafik keuangan', 'report.charts');
    this.manager.addDocument('id', 'statistik pengeluaran', 'report.stats');
  }

  addHelpDocuments() {
    this.manager.addDocument('id', 'bantuan', 'help');
    this.manager.addDocument('id', 'cara pakai', 'help');
    this.manager.addDocument('id', 'panduan', 'help');
    this.manager.addDocument('id', 'format pesan', 'help.format');
    this.manager.addDocument('id', 'contoh pesan', 'help.examples');
  }

  addAnswers() {
    // Transaction responses
    this.manager.addAnswer('id', 'transaction.expense', 'Pengeluaran telah dicatat: {{amount}} untuk {{category}}');
    this.manager.addAnswer('id', 'transaction.income', 'Pemasukan telah dicatat: {{amount}} dari {{source}}');
    this.manager.addAnswer('id', 'transaction.view', 'Berikut riwayat transaksi {{period}}:');

    // Budget responses
    this.manager.addAnswer('id', 'budget.set', 'Budget telah diatur: {{amount}} untuk {{category}}');
    this.manager.addAnswer('id', 'budget.view', 'Berikut ringkasan budget Anda:');
    this.manager.addAnswer('id', 'budget.remaining', 'Sisa budget {{category}}: {{amount}}');

    // Goal responses
    this.manager.addAnswer('id', 'goal.create', 'Target menabung telah dibuat: {{amount}} untuk {{purpose}}');
    this.manager.addAnswer('id', 'goal.view', 'Progress target tabungan Anda:');

    // Report responses
    this.manager.addAnswer('id', 'report.summary', 'Ringkasan keuangan Anda:');
    this.manager.addAnswer('id', 'report.transactions', 'Riwayat transaksi:');
    this.manager.addAnswer('id', 'report.expense.analysis', 'Analisis pengeluaran:');

    // Help responses
    this.manager.addAnswer('id', 'help', this.getHelpMessage());
    this.manager.addAnswer('id', 'help.format', this.getFormatMessage());
    this.manager.addAnswer('id', 'help.examples', this.getExamplesMessage());
  }

  getHelpMessage() {
    return `Selamat datang di Asisten Keuangan!

Saya dapat membantu Anda:
1. Mencatat pemasukan dan pengeluaran
2. Mengatur dan memantau budget
3. Membuat target menabung
4. Melihat laporan keuangan

Ketik "format pesan" untuk melihat format pesan yang dapat digunakan.
Ketik "contoh pesan" untuk melihat contoh penggunaan.`;
  }

  getFormatMessage() {
    return `Format Pesan:

1. Catat Pengeluaran:
   - catat pengeluaran [jumlah] untuk [kategori]
   - bayar [kategori] sebesar [jumlah]

2. Catat Pemasukan:
   - catat pemasukan [jumlah] dari [sumber]
   - terima [jumlah] dari [sumber]

3. Budget:
   - atur budget [kategori] sebesar [jumlah]
   - lihat budget

4. Target Menabung:
   - buat target menabung [jumlah] untuk [tujuan]
   - lihat progress tabungan

5. Laporan:
   - laporan keuangan
   - riwayat transaksi [periode]`;
  }

  getExamplesMessage() {
    return `Contoh Penggunaan:

1. Pengeluaran:
   - catat pengeluaran 50ribu untuk makan
   - bayar transportasi sebesar 25ribu

2. Pemasukan:
   - catat pemasukan 5juta dari gaji
   - terima 500ribu dari proyek

3. Budget:
   - atur budget makan sebesar 2juta
   - atur budget transportasi 500ribu

4. Target:
   - buat target menabung 10juta untuk liburan
   - target keuangan 50juta untuk dp rumah

5. Laporan:
   - riwayat transaksi bulan ini
   - laporan keuangan minggu ini`;
  }

  async processMessage(message, userId) {
    try {
      const result = await this.manager.process('id', message);
      return await this.handleIntent(result, userId);
    } catch (error) {
      logger.error('Error processing message:', error);
      throw error;
    }
  }

  async handleIntent(nlpResult, userId) {
    const { intent, entities } = nlpResult;
    
    try {
      switch (intent) {
        case 'transaction.expense':
        case 'transaction.income':
          return await this.handleTransactionIntent(intent, entities, userId);
        
        case 'budget.set':
        case 'budget.view':
        case 'budget.remaining':
          return await this.handleBudgetIntent(intent, entities, userId);
        
        case 'goal.create':
        case 'goal.view':
          return await this.handleGoalIntent(intent, entities, userId);
        
        case 'report.summary':
        case 'report.transactions':
        case 'report.expense.analysis':
          return await this.handleReportIntent(intent, entities, userId);
        
        case 'help':
        case 'help.format':
        case 'help.examples':
          return this.handleHelpIntent(intent);
        
        default:
          return {
            type: 'unknown',
            message: 'Maaf, saya tidak mengerti pesan Anda. Ketik "bantuan" untuk panduan penggunaan.'
          };
      }
    } catch (error) {
      logger.error('Error handling intent:', error);
      throw error;
    }
  }
}

// Create singleton instance
const nlpHandler = new NLPHandler();

module.exports = {
  handleNLPResponse: (message, userId) => nlpHandler.processMessage(message, userId)
};
