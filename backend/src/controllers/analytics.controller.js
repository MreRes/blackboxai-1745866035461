const advancedAnalytics = require('../services/advancedAnalytics');
const logger = require('../utils/logger');

exports.generateFinancialReport = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period } = req.query;
    const report = await advancedAnalytics.generateFinancialReport(userId, period);
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error generating financial report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating financial report',
      error: error.message
    });
  }
};

exports.getTransactionAnalysis = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    const summary = await advancedAnalytics.getTransactionSummary(
      userId,
      new Date(startDate),
      new Date(endDate)
    );
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error getting transaction analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting transaction analysis',
      error: error.message
    });
  }
};

exports.getBudgetAnalysis = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    const analysis = await advancedAnalytics.getBudgetAnalysis(
      userId,
      new Date(startDate),
      new Date(endDate)
    );
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Error getting budget analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting budget analysis',
      error: error.message
    });
  }
};

exports.getGoalProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const progress = await advancedAnalytics.getGoalProgress(userId);
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    logger.error('Error getting goal progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting goal progress',
      error: error.message
    });
  }
};

exports.getSpendingTrends = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    const trends = await advancedAnalytics.analyzeSpendingTrends(
      userId,
      new Date(startDate),
      new Date(endDate)
    );
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    logger.error('Error getting spending trends:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting spending trends',
      error: error.message
    });
  }
};

exports.getCategoryAnalysis = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    const analysis = await advancedAnalytics.analyzeCategoryDistribution(
      userId,
      new Date(startDate),
      new Date(endDate)
    );
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Error getting category analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting category analysis',
      error: error.message
    });
  }
};

exports.getFinancialHealthScore = async (req, res) => {
  try {
    const { userId } = req.params;
    const healthScore = await advancedAnalytics.calculateFinancialHealthScore(userId);
    res.json({
      success: true,
      data: healthScore
    });
  } catch (error) {
    logger.error('Error calculating financial health score:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating financial health score',
      error: error.message
    });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const period = req.query.period || 'month';
    
    // Get all necessary data for recommendations
    const report = await advancedAnalytics.generateFinancialReport(userId, period);
    const recommendations = advancedAnalytics.generateRecommendations(report);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations',
      error: error.message
    });
  }
};

exports.exportReport = async (req, res) => {
  try {
    const { userId } = req.params;
    const { format, period, startDate, endDate } = req.query;
    
    // Generate report data
    const reportData = await advancedAnalytics.generateFinancialReport(
      userId,
      period || 'month'
    );

    // Format response based on requested format
    switch (format.toLowerCase()) {
      case 'pdf':
        // TODO: Implement PDF generation
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=financial-report.pdf');
        // Send PDF data
        break;

      case 'excel':
        // TODO: Implement Excel generation
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=financial-report.xlsx');
        // Send Excel data
        break;

      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=financial-report.csv');
        // Convert report data to CSV format
        const csvData = convertToCSV(reportData);
        res.send(csvData);
        break;

      default:
        res.json({
          success: true,
          data: reportData
        });
    }
  } catch (error) {
    logger.error('Error exporting report:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting report',
      error: error.message
    });
  }
};

// Helper function to convert data to CSV format
function convertToCSV(data) {
  // Implementation of CSV conversion
  const headers = [
    'Date',
    'Category',
    'Type',
    'Amount',
    'Description'
  ].join(',');

  const rows = data.transactions.map(t => [
    new Date(t.date).toISOString().split('T')[0],
    t.category,
    t.type,
    t.amount,
    t.description
  ].join(','));

  return [headers, ...rows].join('\n');
}

exports.getTaxReport = async (req, res) => {
  try {
    const { userId } = req.params;
    const { year } = req.query;
    
    // Get all income transactions for the year
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    const transactions = await advancedAnalytics.getTransactionSummary(
      userId,
      startDate,
      endDate
    );

    // Calculate tax implications
    const taxReport = {
      year: parseInt(year),
      totalIncome: transactions.totalIncome,
      totalDeductions: calculateDeductions(transactions),
      taxableIncome: 0,
      estimatedTax: 0
    };

    taxReport.taxableIncome = taxReport.totalIncome - taxReport.totalDeductions;
    taxReport.estimatedTax = calculateEstimatedTax(taxReport.taxableIncome);

    res.json({
      success: true,
      data: taxReport
    });
  } catch (error) {
    logger.error('Error generating tax report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating tax report',
      error: error.message
    });
  }
};

// Helper function to calculate deductions
function calculateDeductions(transactions) {
  // Implementation of deduction calculation based on Indonesian tax rules
  // This is a simplified version and should be expanded based on actual tax regulations
  const deductibleCategories = ['zakat', 'sumbangan', 'pendidikan'];
  
  return transactions.categories
    .filter(c => deductibleCategories.includes(c.category.toLowerCase()))
    .reduce((total, c) => total + c.amount, 0);
}

// Helper function to calculate estimated tax
function calculateEstimatedTax(taxableIncome) {
  // Implementation of tax calculation based on Indonesian tax brackets
  // This is a simplified version and should be updated with actual tax rates
  if (taxableIncome <= 50000000) return taxableIncome * 0.05;
  if (taxableIncome <= 250000000) return taxableIncome * 0.15;
  if (taxableIncome <= 500000000) return taxableIncome * 0.25;
  return taxableIncome * 0.30;
}
