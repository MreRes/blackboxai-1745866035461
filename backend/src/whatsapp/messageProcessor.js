const { NlpManager } = require('node-nlp');
const logger = require('../utils/logger');
const Transaction = require('../models/transaction.model');
const Budget = require('../models/budget.model');
const Goal = require('../models/goal.model');

// Initialize NLP Manager
const manager = new NlpManager({ languages: ['id'], forceNER: true });

// Train NLP with common Indonesian financial phrases and patterns
const trainNLP = async () => {
  // Transaction related intents
  manager.addDocument('id', 'catat pengeluaran *', 'transaction.expense');
  manager.addDocument('id', 'saya menghabiskan * untuk *', 'transaction.expense');
  manager.addDocument('id', 'bayar * sebesar *', 'transaction.expense');
  manager.addDocument('id', 'beli * seharga *', 'transaction.expense');
  
  manager.addDocument('id', 'catat pemasukan *', 'transaction.income');
  manager.addDocument('id', 'terima uang * dari *', 'transaction.income');
  manager.addDocument('id', 'gajian * rupiah', 'transaction.income');
  
  // Budget related intents
  manager.addDocument('id', 'atur budget * sebesar *', 'budget.set');
  manager.addDocument('id', 'buat anggaran * untuk *', 'budget.set');
  manager.addDocument('id', 'lihat budget', 'budget.view');
  manager.addDocument('id', 'cek anggaran', 'budget.view');
  
  // Goal related intents
  manager.addDocument('id', 'buat target menabung *', 'goal.create');
  manager.addDocument('id', 'target keuangan * sebesar *', 'goal.create');
  manager.addDocument('id', 'lihat progress tabungan', 'goal.view');
  
  // Report related intents
  manager.addDocument('id', 'laporan keuangan', 'report.summary');
  manager.addDocument('id', 'ringkasan transaksi', 'report.transactions');
  manager.addDocument('id', 'analisis pengeluaran', 'report.expense.analysis');
  
  // Help related intents
  manager.addDocument('id', 'bantuan', 'help');
  manager.addDocument('id', 'cara pakai', 'help');
  manager.addDocument('id', 'format pesan', 'help.format');

  // Add entities
  manager.addNamedEntityText('amount', 'currency', ['id'], [
    'ribu',
    'juta',
    'rupiah',
    'rp',
    'k',
    'm'
  ]);

  manager.addNamedEntityText('category', 'expense', ['id'], [
    'makan',
    'transportasi',
    'belanja',
    'kesehatan',
    'pendidikan',
    'hiburan',
    'utilitas',
    'lainnya'
  ]);

  // Train responses
  manager.addAnswer('id', 'transaction.expense', 'Pengeluaran telah dicatat: {{amount}} untuk {{category}}');
  manager.addAnswer('id', 'transaction.income', 'Pemasukan telah dicatat: {{amount}}');
  manager.addAnswer('id', 'budget.set', 'Budget telah diatur: {{amount}} untuk {{category}}');
  manager.addAnswer('id', 'budget.view', 'Berikut ringkasan budget Anda:');
  manager.addAnswer('id', 'goal.create', 'Target menabung telah dibuat: {{amount}}');
  manager.addAnswer('id', 'goal.view', 'Berikut progress target tabungan Anda:');
  manager.addAnswer('id', 'help', 'Berikut panduan penggunaan bot:...');

  await manager.train();
  logger.info('NLP Manager trained successfully');
};

// Initialize NLP training
trainNLP().catch(logger.error);

const processMessage = async (message) => {
  try {
    const { from, body } = message;
    
    // Extract user from phone number
    const User = require('../models/user.model');
    const user = await User.findOne({
      'whatsappNumbers.number': from.replace(/[^\d]/g, '')
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Process message with NLP
    const result = await manager.process('id', body);
    
    // Handle different intents
    switch (result.intent) {
      case 'transaction.expense':
        return await handleExpenseTransaction(user, result);
      
      case 'transaction.income':
        return await handleIncomeTransaction(user, result);
      
      case 'budget.set':
        return await handleBudgetSet(user, result);
      
      case 'budget.view':
        return await handleBudgetView(user);
      
      case 'goal.create':
        return await handleGoalCreate(user, result);
      
      case 'goal.view':
        return await handleGoalView(user);
      
      case 'report.summary':
        return await handleReportSummary(user);
      
      case 'help':
        return getHelpMessage();
      
      default:
        return {
          type: 'unknown',
          message: 'Maaf, saya tidak mengerti pesan Anda. Ketik "bantuan" untuk melihat panduan penggunaan.'
        };
    }
  } catch (error) {
    logger.error('Error processing message:', error);
    throw error;
  }
};

// Helper function to extract amount from text
const extractAmount = (text) => {
  const numbers = text.match(/\d+([,.]\d+)?/);
  if (!numbers) return null;
  
  const amount = parseFloat(numbers[0].replace(',', '.'));
  
  if (text.includes('juta')) return amount * 1000000;
  if (text.includes('ribu')) return amount * 1000;
  return amount;
};

// Handler functions for different intents
const handleExpenseTransaction = async (user, nlpResult) => {
  const amount = extractAmount(nlpResult.utterance);
  const category = nlpResult.entities.find(e => e.entity === 'category')?.value || 'lainnya';

  const transaction = new Transaction({
    userId: user._id,
    type: 'expense',
    amount,
    category,
    description: nlpResult.utterance,
    source: 'whatsapp'
  });

  await transaction.save();

  return {
    type: 'transaction.expense',
    message: `Pengeluaran sebesar Rp ${amount.toLocaleString('id-ID')} untuk ${category} telah dicatat.`
  };
};

// Similar handler functions for other intents...

const getHelpMessage = () => {
  return {
    type: 'help',
    message: `Panduan Penggunaan Bot:
1. Catat Pengeluaran: "catat pengeluaran [jumlah] untuk [kategori]"
2. Catat Pemasukan: "catat pemasukan [jumlah] dari [sumber]"
3. Atur Budget: "atur budget [kategori] sebesar [jumlah]"
4. Lihat Budget: "lihat budget"
5. Buat Target: "buat target menabung [jumlah]"
6. Lihat Laporan: "laporan keuangan"

Contoh:
- catat pengeluaran 50ribu untuk makan
- catat pemasukan 5juta dari gaji
- atur budget makan sebesar 2juta`
  };
};

module.exports = {
  processMessage,
  trainNLP
};
