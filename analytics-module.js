// analytics.js - Analytics and reporting module
// Provides data visualization and insights for inspections

export class AnalyticsModule {
  constructor(blobStorage) {
    this.blobStorage = blobStorage;
    this.charts = new Map();
    this.chartColors = {
      primary: 'rgb(99, 102, 241)',
      success: 'rgb(16, 185, 129)',
      danger: 'rgb(239, 68, 68)',
      warning: 'rgb(245, 158, 11)',
      info: 'rgb(59, 130, 246)',
      secondary: 'rgb(100, 116, 139)'
    };
  }

  // Initialize analytics dashboard
  async initializeDashboard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = this.getDashboardHTML();
    
    // Load and render data
    await this.loadAnalyticsData();
    this.renderAllCharts();
  }

  // Get dashboard HTML structure
  getDashboardHTML() {
    return `
      <div class="analytics-dashboard">
        <!-- Time Range Selector -->
        <div class="analytics-controls">
          <div class="time-range-selector">
            <label class="form-label">Time Range:</label>
            <select id="analytics-time-range" class="form-control" onchange="window.analytics.updateTimeRange(this.value)">
              <option value="7">Last 7 Days</option>
              <option value="30" selected>Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          <div class="location-filter">
            <label class="form-label">Location:</label>
            <select id="analytics-location" class="form-control" onchange="window.analytics.updateLocation(this.value)">
              <option value="all">All Locations</option>
              <option value="DVI1">DVI1 - Vienna Distribution</option>
              <option value="DVI2">DVI2 - Vienna Hub North</option>
              <option value="DVI3">DVI3 - Vienna Hub South</option>
              <option value="DAP5">DAP5 - Salzburg Center</option>
              <option value="DAP8">DAP8 - Graz Distribution</option>
            </select>
          </div>
          
          <button class="btn btn-secondary" onclick="window.analytics.exportAnalytics()">
            <i class="fas fa-download"></i>
            Export Report
          </button>
        </div>
        
        <!-- Key Metrics -->
        <div class="analytics-metrics">
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-percentage"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value" id="metric-compliance">0%</div>
              <div class="metric-label">Overall Compliance</div>
              <div class="metric-trend" id="trend-compliance">
                <i class="fas fa-arrow-up"></i> +0%
              </div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-clipboard-check"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value" id="metric-inspections">0</div>
              <div class="metric-label">Total Inspections</div>
              <div class="metric-trend" id="trend-inspections">
                <i class="fas fa-arrow-up"></i> +0
              </div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value" id="metric-issues">0</div>
              <div class="metric-label">Open Issues</div>
              <div class="metric-trend negative" id="trend-issues">
                <i class="fas fa-arrow-down"></i> -0
              </div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value" id="metric-avgtime">0m</div>
              <div class="metric-label">Avg. Inspection Time</div>
              <div class="metric-trend" id="trend-avgtime">
                <i class="fas fa-minus"></i> 0m
              </div>
            </div>
          </div>
        </div>
        
        <!-- Charts Grid -->
        <div class="analytics-charts">
          <!-- Compliance Trend Chart -->
          <div class="chart-container">
            <h3 class="chart-title">Compliance Trend</h3>
            <canvas id="compliance-trend-chart"></canvas>
          </div>
          
          <!-- Inspection Types Distribution -->
          <div class="chart-container">
            <h3 class="chart-title">Inspection Types</h3>
            <canvas id="inspection-types-chart"></canvas>
          </div>
          
          <!-- Issues by Category -->
          <div class="chart-container">
            <h3 class="chart-title">Issues by Category</h3>
            <canvas id="issues-category-chart"></canvas>
          </div>
          
          <!-- Location Performance -->
          <div class="chart-container">
            <h3 class="chart-title">Location Performance</h3>
            <canvas id="location-performance-chart"></canvas>
          </div>
          
          <!-- Monthly Inspections -->
          <div class="chart-container full-width">
            <h3 class="chart-title">Monthly Inspection Volume</h3>
            <canvas id="monthly-inspections-chart"></canvas>
          </div>
          
          <!-- Top Issues Table -->
          <div class="chart-container full-width">
            <h3 class="chart-title">Top Recurring Issues</h3>
            <div id="top-issues-table" class="data-table"></div>
          </div>
        </div>
      </div>
      
      <style>
        .analytics-dashboard {
          padding: 20px;
        }
        
        .analytics-controls {
          display: flex;
          gap: 20px;
          align-items: flex-end;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        
        .analytics-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .metric-card {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: all var(--transition-fast);
        }
        
        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary);
        }
        
        .metric-icon {
          width: 60px;
          height: 60px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: var(--primary);
        }
        
        .metric-content {
          flex: 1;
        }
        
        .metric-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }
        
        .metric-label {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-top: 4px;
        }
        
        .metric-trend {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 8px;
          padding: 4px 8px;
          background: rgba(16, 185, 129, 0.1);
          color: var(--success);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .metric-trend.negative {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
        }
        
        .analytics-charts {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
        }
        
        .chart-container {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: 20px;
        }
        
        .chart-container.full-width {
          grid-column: 1 / -1;
        }
        
        .chart-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 20px;
          color: var(--text-primary);
        }
        
        .data-table {
          overflow-x: auto;
        }
        
        .data-table table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .data-table th {
          background: var(--bg-tertiary);
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: var(--text-secondary);
          border-bottom: 2px solid var(--border-primary);
        }
        
        .data-table td {
          padding: 12px;
          border-bottom: 1px solid var(--border-primary);
        }
        
        .data-table tr:hover {
          background: var(--bg-hover);
        }
        
        @media (max-width: 768px) {
          .analytics-metrics {
            grid-template-columns: 1fr;
          }
          
          .analytics-charts {
            grid-template-columns: 1fr;
          }
          
          .chart-container {
            min-width: 0;
          }
        }
      </style>
    `;
  }

  // Load analytics data
  async loadAnalyticsData() {
    try {
      // Get inspections
      const result = await this.blobStorage.listInspections();
      this.inspections = result.items || [];
      
      // Get time range
      const timeRange = document.getElementById('analytics-time-range')?.value || '30';
      const location = document.getElementById('analytics-location')?.value || 'all';
      
      // Filter data
      this.filteredData = this.filterData(this.inspections, timeRange, location);
      
      // Calculate metrics
      this.metrics = this.calculateMetrics(this.filteredData);
      
      // Update UI
      this.updateMetrics();
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  }

  // Filter data by time range and location
  filterData(data, timeRange, location) {
    let filtered = [...data];
    
    // Time filter
    if (timeRange !== 'all') {
      const days = parseInt(timeRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      
      filtered = filtered.filter(item => 
        new Date(item.date || item.createdAt) >= cutoff
      );
    }
    
    // Location filter
    if (location !== 'all') {
      filtered = filtered.filter(item => item.location === location);
    }
    
    return filtered;
  }

  // Calculate metrics
  calculateMetrics(data) {
    const metrics = {
      totalInspections: data.length,
      completedInspections: data.filter(i => i.status === 'completed').length,
      complianceRate: 0,
      openIssues: 0,
      avgInspectionTime: 0,
      trends: {
        compliance: 0,
        inspections: 0,
        issues: 0,
        time: 0
      }
    };
    
    // Calculate compliance rate
    const completed = data.filter(i => i.status === 'completed');
    if (completed.length > 0) {
      const passRates = completed.map(i => {
        const responses = Object.values(i.responses || {});
        const passed = responses.filter(r => r === 'pass').length;
        const total = responses.filter(r => r !== 'na').length;
        return total > 0 ? (passed / total) * 100 : 0;
      });
      
      metrics.complianceRate = Math.round(
        passRates.reduce((a, b) => a + b, 0) / passRates.length
      );
    }
    
    // Count open issues
    data.forEach(inspection => {
      if (inspection.responses) {
        const failures = Object.values(inspection.responses).filter(r => r === 'fail').length;
        metrics.openIssues += failures;
      }
    });
    
    // Calculate average inspection time
    const times = completed
      .filter(i => i.duration)
      .map(i => i.duration);
    
    if (times.length > 0) {
      metrics.avgInspectionTime = Math.round(
        times.reduce((a, b) => a + b, 0) / times.length / 60 // Convert to minutes
      );
    }
    
    // Calculate trends (compare with previous period)
    // TODO: Implement trend calculations
    
    return metrics;
  }

  // Update metrics display
  updateMetrics() {
    // Compliance
    const complianceEl = document.getElementById('metric-compliance');
    if (complianceEl) {
      complianceEl.textContent = `${this.metrics.complianceRate}%`;
    }
    
    // Total inspections
    const inspectionsEl = document.getElementById('metric-inspections');
    if (inspectionsEl) {
      inspectionsEl.textContent = this.metrics.totalInspections;
    }
    
    // Open issues
    const issuesEl = document.getElementById('metric-issues');
    if (issuesEl) {
      issuesEl.textContent = this.metrics.openIssues;
    }
    
    // Average time
    const timeEl = document.getElementById('metric-avgtime');
    if (timeEl) {
      timeEl.textContent = `${this.metrics.avgInspectionTime}m`;
    }
  }

  // Render all charts
  renderAllCharts() {
    this.renderComplianceTrend();
    this.renderInspectionTypes();
    this.renderIssuesByCategory();
    this.renderLocationPerformance();
    this.renderMonthlyInspections();
    this.renderTopIssuesTable();
  }

  // Render compliance trend chart
  renderComplianceTrend() {
    const canvas = document.getElementById('compliance-trend-chart');
    if (!canvas) return;
    
    // Destroy existing chart
    if (this.charts.has('compliance-trend')) {
      this.charts.get('compliance-trend').destroy();
    }
    
    // Prepare data
    const dates = this.getLast30Days();
    const complianceData = this.calculateDailyCompliance(dates);
    
    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: dates.map(d => d.toLocaleDateString('en', { month: 'short', day: 'numeric' })),
        datasets: [{
          label: 'Compliance Rate',
          data: complianceData,
          borderColor: this.chartColors.primary,
          backgroundColor: `${this.chartColors.primary}20`,
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value) => `${value}%`,
              color: 'var(--text-secondary)'
            },
            grid: {
              color: 'var(--border-primary)'
            }
          },
          x: {
            ticks: {
              color: 'var(--text-secondary)'
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
    
    this.charts.set('compliance-trend', chart);
  }

  // Render inspection types chart
  renderInspectionTypes() {
    const canvas = document.getElementById('inspection-types-chart');
    if (!canvas) return;
    
    // Destroy existing chart
    if (this.charts.has('inspection-types')) {
      this.charts.get('inspection-types').destroy();
    }
    
    // Count by type
    const typeCounts = {};
    this.filteredData.forEach(inspection => {
      const type = inspection.type || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    const chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: Object.keys(typeCounts),
        datasets: [{
          data: Object.values(typeCounts),
          backgroundColor: [
            this.chartColors.primary,
            this.chartColors.success,
            this.chartColors.warning,
            this.chartColors.info,
            this.chartColors.danger
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              color: 'var(--text-secondary)'
            }
          }
        }
      }
    });
    
    this.charts.set('inspection-types', chart);
  }

  // Render issues by category chart
  renderIssuesByCategory() {
    const canvas = document.getElementById('issues-category-chart');
    if (!canvas) return;
    
    // Destroy existing chart
    if (this.charts.has('issues-category')) {
      this.charts.get('issues-category').destroy();
    }
    
    // Mock data - replace with actual categorization
    const categories = ['Safety Equipment', 'Fire Safety', 'PPE', 'Emergency', 'Environmental'];
    const issueCounts = [12, 8, 5, 3, 7];
    
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [{
          label: 'Issues',
          data: issueCounts,
          backgroundColor: this.chartColors.danger,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: 'var(--text-secondary)'
            },
            grid: {
              color: 'var(--border-primary)'
            }
          },
          x: {
            ticks: {
              color: 'var(--text-secondary)'
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
    
    this.charts.set('issues-category', chart);
  }

  // Render location performance chart
  renderLocationPerformance() {
    const canvas = document.getElementById('location-performance-chart');
    if (!canvas) return;
    
    // Destroy existing chart
    if (this.charts.has('location-performance')) {
      this.charts.get('location-performance').destroy();
    }
    
    // Calculate performance by location
    const locations = ['DVI1', 'DVI2', 'DVI3', 'DAP5', 'DAP8'];
    const performance = locations.map(loc => {
      const locationInspections = this.filteredData.filter(i => i.location === loc);
      if (locationInspections.length === 0) return 0;
      
      // Calculate average pass rate
      const passRates = locationInspections.map(i => {
        const responses = Object.values(i.responses || {});
        const passed = responses.filter(r => r === 'pass').length;
        const total = responses.filter(r => r !== 'na').length;
        return total > 0 ? (passed / total) * 100 : 0;
      });
      
      return Math.round(passRates.reduce((a, b) => a + b, 0) / passRates.length);
    });
    
    const chart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: locations,
        datasets: [{
          label: 'Compliance %',
          data: performance,
          borderColor: this.chartColors.primary,
          backgroundColor: `${this.chartColors.primary}20`,
          borderWidth: 2,
          pointBackgroundColor: this.chartColors.primary,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: this.chartColors.primary
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20,
              callback: (value) => `${value}%`,
              color: 'var(--text-secondary)'
            },
            grid: {
              color: 'var(--border-primary)'
            },
            pointLabels: {
              color: 'var(--text-primary)',
              font: {
                size: 12
              }
            }
          }
        }
      }
    });
    
    this.charts.set('location-performance', chart);
  }

  // Render monthly inspections chart
  renderMonthlyInspections() {
    const canvas = document.getElementById('monthly-inspections-chart');
    if (!canvas) return;
    
    // Destroy existing chart
    if (this.charts.has('monthly-inspections')) {
      this.charts.get('monthly-inspections').destroy();
    }
    
    // Get last 12 months
    const months = this.getLast12Months();
    const monthlyData = months.map(month => {
      return this.filteredData.filter(i => {
        const date = new Date(i.date || i.createdAt);
        return date.getMonth() === month.getMonth() && 
               date.getFullYear() === month.getFullYear();
      }).length;
    });
    
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: months.map(m => m.toLocaleDateString('en', { month: 'short', year: '2-digit' })),
        datasets: [{
          label: 'Inspections',
          data: monthlyData,
          backgroundColor: this.chartColors.primary,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: 'var(--text-secondary)'
            },
            grid: {
              color: 'var(--border-primary)'
            }
          },
          x: {
            ticks: {
              color: 'var(--text-secondary)'
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
    
    this.charts.set('monthly-inspections', chart);
  }

  // Render top issues table
  renderTopIssuesTable() {
    const container = document.getElementById('top-issues-table');
    if (!container) return;
    
    // Collect all failed questions
    const failedQuestions = {};
    
    this.filteredData.forEach(inspection => {
      if (inspection.responses) {
        Object.entries(inspection.responses).forEach(([questionId, response]) => {
          if (response === 'fail') {
            if (!failedQuestions[questionId]) {
              failedQuestions[questionId] = {
                id: questionId,
                count: 0,
                locations: new Set()
              };
            }
            failedQuestions[questionId].count++;
            failedQuestions[questionId].locations.add(inspection.location);
          }
        });
      }
    });
    
    // Sort by frequency
    const topIssues = Object.values(failedQuestions)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Create table
    const table = `
      <table>
        <thead>
          <tr>
            <th>Issue</th>
            <th>Occurrences</th>
            <th>Locations Affected</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          ${topIssues.map(issue => `
            <tr>
              <td>${this.getQuestionText(issue.id)}</td>
              <td>${issue.count}</td>
              <td>${Array.from(issue.locations).join(', ')}</td>
              <td>
                <span class="trend-indicator ${Math.random() > 0.5 ? 'up' : 'down'}">
                  <i class="fas fa-arrow-${Math.random() > 0.5 ? 'up' : 'down'}"></i>
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    container.innerHTML = table;
  }

  // Helper methods
  getLast30Days() {
    const dates = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    return dates;
  }

  getLast12Months() {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date);
    }
    return months;
  }

  calculateDailyCompliance(dates) {
    return dates.map(date => {
      const dayInspections = this.filteredData.filter(i => {
        const inspDate = new Date(i.date || i.createdAt);
        return inspDate.toDateString() === date.toDateString();
      });
      
      if (dayInspections.length === 0) return null;
      
      const passRates = dayInspections.map(i => {
        const responses = Object.values(i.responses || {});
        const passed = responses.filter(r => r === 'pass').length;
        const total = responses.filter(r => r !== 'na').length;
        return total > 0 ? (passed / total) * 100 : 0;
      });
      
      return Math.round(passRates.reduce((a, b) => a + b, 0) / passRates.length);
    });
  }

  getQuestionText(questionId) {
    // Map question IDs to text (would be loaded from templates)
    const questionMap = {
      'q1': 'Emergency exits not properly marked',
      'q2': 'Fire extinguisher maintenance overdue',
      'q3': 'PPE not available or damaged',
      'q4': 'Safety guards missing or damaged',
      'q5': 'Spill kit not properly stocked'
    };
    
    return questionMap[questionId] || `Question ${questionId}`;
  }

  // Update time range
  async updateTimeRange(value) {
    await this.loadAnalyticsData();
    this.renderAllCharts();
  }

  // Update location filter
  async updateLocation(value) {
    await this.loadAnalyticsData();
    this.renderAllCharts();
  }

  // Export analytics report
  async exportAnalytics() {
    try {
      const report = {
        generatedAt: new Date().toISOString(),
        generatedBy: window.state?.user?.email || 'Unknown',
        timeRange: document.getElementById('analytics-time-range')?.value || '30',
        location: document.getElementById('analytics-location')?.value || 'all',
        metrics: this.metrics,
        data: this.filteredData
      };
      
      // Create CSV
      const csv = this.generateCSV(report);
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      URL.revokeObjectURL(url);
      
      if (window.showNotification) {
        window.showNotification('Analytics report exported', 'success');
      }
    } catch (error) {
      console.error('Export error:', error);
      if (window.showNotification) {
        window.showNotification('Error exporting report', 'error');
      }
    }
  }

  // Generate CSV report
  generateCSV(report) {
    const rows = [
      ['Aurora Audit Platform - Analytics Report'],
      ['Generated:', new Date(report.generatedAt).toLocaleString()],
      ['Generated By:', report.generatedBy],
      ['Time Range:', `Last ${report.timeRange} days`],
      ['Location:', report.location === 'all' ? 'All Locations' : report.location],
      [],
      ['Key Metrics'],
      ['Metric', 'Value'],
      ['Overall Compliance', `${report.metrics.complianceRate}%`],
      ['Total Inspections', report.metrics.totalInspections],
      ['Completed Inspections', report.metrics.completedInspections],
      ['Open Issues', report.metrics.openIssues],
      ['Average Inspection Time', `${report.metrics.avgInspectionTime} minutes`],
      [],
      ['Inspection Details'],
      ['ID', 'Date', 'Location', 'Type', 'Status', 'Pass Rate', 'Issues']
    ];
    
    // Add inspection details
    report.data.forEach(inspection => {
      const responses = Object.values(inspection.responses || {});
      const passed = responses.filter(r => r === 'pass').length;
      const failed = responses.filter(r => r === 'fail').length;
      const total = responses.filter(r => r !== 'na').length;
      const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
      
      rows.push([
        inspection.id,
        new Date(inspection.date || inspection.createdAt).toLocaleDateString(),
        inspection.location,
        inspection.type,
        inspection.status,
        `${passRate}%`,
        failed
      ]);
    });
    
    // Convert to CSV
    return rows.map(row => 
      row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? 
          `"${cell}"` : cell
      ).join(',')
    ).join('\n');
  }
}

// Make available globally
window.AnalyticsModule = AnalyticsModule;

// Initialize analytics when needed
window.initializeAnalytics = async function() {
  if (!window.analytics) {
    window.analytics = new AnalyticsModule(window.blobStorage);
  }
  await window.analytics.initializeDashboard('analytics-chart');
};