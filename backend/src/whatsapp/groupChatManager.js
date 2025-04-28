const logger = require('../utils/logger');
const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');

class GroupChatManager {
  constructor() {
    this.groupExpenses = new Map(); // Map<groupId, Map<userId, amount>>
  }

  // Initialize group expense tracking for a group
  initGroup(groupId) {
    if (!this.groupExpenses.has(groupId)) {
      this.groupExpenses.set(groupId, new Map());
      logger.info(`Initialized expense tracking for group ${groupId}`);
    }
  }

  // Add expense for a user in a group
  addExpense(groupId, userId, amount) {
    this.initGroup(groupId);
    const groupMap = this.groupExpenses.get(groupId);
    const currentAmount = groupMap.get(userId) || 0;
    groupMap.set(userId, currentAmount + amount);
    logger.info(`Added expense ${amount} for user ${userId} in group ${groupId}`);
  }

  // Get total expenses for a group
  getTotalExpenses(groupId) {
    this.initGroup(groupId);
    const groupMap = this.groupExpenses.get(groupId);
    let total = 0;
    for (const amount of groupMap.values()) {
      total += amount;
    }
    return total;
  }

  // Get individual shares for a group
  getShares(groupId) {
    this.initGroup(groupId);
    const groupMap = this.groupExpenses.get(groupId);
    const total = this.getTotalExpenses(groupId);
    const numUsers = groupMap.size;
    const sharePerUser = total / numUsers;
    const shares = {};
    for (const [userId, amount] of groupMap.entries()) {
      shares[userId] = {
        paid: amount,
        owes: sharePerUser - amount
      };
    }
    return shares;
  }

  // Clear group expenses (e.g., after settlement)
  clearGroup(groupId) {
    this.groupExpenses.delete(groupId);
    logger.info(`Cleared expense tracking for group ${groupId}`);
  }

  // Generate summary message for group
  async generateGroupSummaryMessage(groupId) {
    this.initGroup(groupId);
    const shares = this.getShares(groupId);
    let message = 'Ringkasan pengeluaran grup:\n';
    for (const [userId, data] of Object.entries(shares)) {
      const user = await User.findById(userId);
      const username = user ? user.username : 'Anggota';
      message += `- ${username}: Bayar ${data.paid.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}, `;
      if (data.owes > 0) {
        message += `Hutang ${data.owes.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}\n`;
      } else if (data.owes < 0) {
        message += `Kelebihan bayar ${(-data.owes).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}\n`;
      } else {
        message += 'Lunas\n';
      }
    }
    return message;
  }
}

module.exports = new GroupChatManager();
