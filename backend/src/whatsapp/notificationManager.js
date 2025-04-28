const logger = require('../utils/logger');
const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');
const Budget = require('../models/budget.model');
const Goal = require('../models/goal.model');

class NotificationManager {
  constructor() {
    this.scheduledNotifications = new Map(); // Map<userId, timeoutId>
  }

  async scheduleNotifications(userId, client) {
    try {
      // Clear existing scheduled notifications for user
      if (this.scheduledNotifications.has(userId)) {
        clearTimeout(this.scheduledNotifications.get(userId));
      }

      // Fetch user preferences and data
      const user = await User.findById(userId);
      if (!user || !user.isActive) return;

      // Example: Schedule bill payment reminder 3 days before due date
      const upcomingBills = await this.getUpcomingBills(userId);
      upcomingBills.forEach(bill => {
        const now = new Date();
        const reminderTime = new Date(bill.dueDate);
        reminderTime.setDate(reminderTime.getDate() - 3);
        const delay = reminderTime - now;
        if (delay > 0) {
          const timeoutId = setTimeout(() => {
            client.sendMessage(user.whatsappNumbers[0].number, `Pengingat: Tagihan ${bill.name} akan jatuh tempo pada ${bill.dueDate.toLocaleDateString()}.`);
          }, delay);
          this.scheduledNotifications.set(userId, timeoutId);
        }
      });

      // Example: Schedule budget alerts if spending exceeds threshold
      const budgets = await Budget.find({ userId, status: 'active' });
      budgets.forEach(async budget => {
        const spending = await this.getSpendingForBudget(userId, budget);
        if (spending >= budget.amount * 0.8) {
          client.sendMessage(user.whatsappNumbers[0].number, `Peringatan: Pengeluaran untuk kategori ${budget.category} sudah mencapai 80% dari anggaran.`);
        }
      });

      // Example: Notify goal achievements
      const goals = await Goal.find({ userId, status: 'active' });
      goals.forEach(goal => {
        if (goal.currentAmount >= goal.targetAmount) {
          client.sendMessage(user.whatsappNumbers[0].number, `Selamat! Anda telah mencapai target tabungan untuk ${goal.name}.`);
        }
      });

      // Example: Reminder for daily transaction recording
      const now = new Date();
      const nextReminder = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0); // 8 PM daily
      let delay = nextReminder - now;
      if (delay < 0) delay += 24 * 60 * 60 * 1000; // Next day

      const dailyReminderId = setTimeout(() => {
        client.sendMessage(user.whatsappNumbers[0].number, 'Pengingat: Jangan lupa catat transaksi keuangan hari ini.');
        this.scheduleNotifications(userId, client); // Reschedule for next day
      }, delay);
      this.scheduledNotifications.set(userId, dailyReminderId);

      // Example: Reminder for activation code expiry
      const expiryDate = user.expiryDate;
      const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7 && daysLeft > 0) {
        client.sendMessage(user.whatsappNumbers[0].number, `Peringatan: Masa aktif kode aktivasi Anda akan berakhir dalam ${daysLeft} hari. Silakan perpanjang segera.`);
      }
    } catch (error) {
      logger.error('Error scheduling notifications:', error);
    }
  }

  async getUpcomingBills(userId) {
    // Placeholder: Fetch upcoming bills from database or external API
    // For now, return empty array
    return [];
  }

  async getSpendingForBudget(userId, budget) {
    // Calculate total spending for budget period and category
    const transactions = await Transaction.find({
      userId,
      category: budget.category,
      type: 'expense',
      date: { $gte: budget.startDate, $lte: budget.endDate }
    });
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }

  cancelNotifications(userId) {
    if (this.scheduledNotifications.has(userId)) {
      clearTimeout(this.scheduledNotifications.get(userId));
      this.scheduledNotifications.delete(userId);
    }
  }
}

module.exports = new NotificationManager();
