import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

// Mock Netlify Identity for demo
const AuthContext = createContext();

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, initialize Netlify Identity here
    const mockUser = localStorage.getItem('mockUser');
    if (mockUser) {
      setUser(JSON.parse(mockUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    // Mock login - replace with Netlify Identity
    const mockUser = {
      id: 'user-' + Date.now(),
      email,
      name: email.split('@')[0],
      role: 'inspector'
    };
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    setUser(mockUser);
    return Promise.resolve(mockUser);
  };

  const logout = () => {
    localStorage.removeItem('mockUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Database Service (Mock)
const db = {
  templates: [],
  audits: [],
  
  init() {
    const savedTemplates = localStorage.getItem('templates');
    const savedAudits = localStorage.getItem('audits');
    
    if (savedTemplates) {
      this.templates = JSON.parse(savedTemplates);
    } else {
      // Default templates
      this.templates = [
        {
          id: 'template-1',
          name: 'General Safety Inspection',
          version: '1.0',
          questions: [
            { id: 'q1', text: 'Are all emergency exits clearly marked?', type: 'passfail', required: true },
            { id: 'q2', text: 'Is PPE being worn correctly?', type: 'passfail', required: true },
            { id: 'q3', text: 'Are fire extinguishers accessible?', type: 'passfail', required: true }
          ],
          created_by: 'system',
          created_at: new Date().toISOString()
        }
      ];
      this.saveTemplates();
    }
    
    if (savedAudits) {
      this.audits = JSON.parse(savedAudits);
    }
  },
  
  saveTemplates() {
    localStorage.setItem('templates', JSON.stringify(this.templates));
  },
  
  saveAudits() {
    localStorage.setItem('audits', JSON.stringify(this.audits));
  },
  
  getTemplates() {
    return Promise.resolve(this.templates);
  },
  
  createTemplate(template) {
    const newTemplate = {
      ...template,
      id: 'template-' + Date.now(),
      created_at: new Date().toISOString()
    };
    this.templates.push(newTemplate);
    this.saveTemplates();
    return Promise.resolve(newTemplate);
  },
  
  updateTemplate(id, updates) {
    const index = this.templates.findIndex(t => t.id === id);
    if (index !== -1) {
      this.templates[index] = { ...this.templates[index], ...updates };
      this.saveTemplates();
    }
    return Promise.resolve(this.templates[index]);
  },
  
  deleteTemplate(id) {
    this.templates = this.templates.filter(t => t.id !== id);
    this.saveTemplates();
    return Promise.resolve();
  },
  
  getAudits(userId) {
    return Promise.resolve(this.audits.filter(a => a.user_id === userId));
  },
  
  createAudit(audit) {
    const newAudit = {
      ...audit,
      id: 'audit-' + Date.now(),
      created_at: new Date().toISOString()
    };
    this.audits.push(newAudit);
    this.saveAudits();
    return Promise.resolve(newAudit);
  },
  
  updateAudit(id, updates) {
    const index = this.audits.findIndex(a => a.id === id);
    if (index !== -1) {
      this.audits[index] = { ...this.audits[index], ...updates };
      this.saveAudits();
    }
    return Promise.resolve(this.audits[index]);
  }
};

db.init();

// Login Component
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      alert('Login failed');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <i className="fas fa-shield-alt logo-icon"></i>
          <h1>Aurora Audit</h1>
          <p>Professional Safety Inspection Platform</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    compliance: 0
  });
  const [recentAudits, setRecentAudits] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const audits = await db.getAudits(user.id);
    const completed = audits.filter(a => a.status === 'completed');
    const pending = audits.filter(a => a.status === 'pending');
    
    // Calculate compliance
    let totalQuestions = 0;
    let passedQuestions = 0;
    
    completed.forEach(audit => {
      if (audit.responses) {
        Object.values(audit.responses).forEach(response => {
          totalQuestions++;
          if (response.answer === 'pass') passedQuestions++;
        });
      }
    });
    
    const compliance = totalQuestions > 0 ? Math.round((passedQuestions / totalQuestions) * 100) : 0;
    
    setStats({
      total: audits.length,
      completed: completed.length,
      pending: pending.length,
      compliance
    });
    
    setRecentAudits(audits.slice(-5).reverse());
  };

  return (
    <div className="dashboard">
      <header className="app-header">
        <div className="header-content">
          <h1><i className="fas fa-shield-alt"></i> Aurora Audit</h1>
          <div className="header-actions">
            <span className="user-name">{user.name}</span>
            <button onClick={logout} className="btn-secondary">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Audits</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.compliance}%</div>
            <div className="stat-label">Compliance Rate</div>
          </div>
        </div>

        <div className="quick-actions">
          <button onClick={() => navigate('/audit/new')} className="btn-primary btn-large">
            <i className="fas fa-plus"></i> Start New Audit
          </button>
          <button onClick={() => navigate('/templates')} className="btn-secondary btn-large">
            <i className="fas fa-file-alt"></i> Manage Templates
          </button>
        </div>

        <div className="recent-audits">
          <h2>Recent Audits</h2>
          {recentAudits.length === 0 ? (
            <p className="empty-state">No audits yet. Start your first audit!</p>
          ) : (
            <div className="audit-list">
              {recentAudits.map(audit => (
                <div key={audit.id} className="audit-item" onClick={() => navigate(`/audit/${audit.id}`)}>
                  <div className="audit-header">
                    <h3>{audit.location}</h3>
                    <span className={`status status-${audit.status}`}>{audit.status}</span>
                  </div>
                  <div className="audit-meta">
                    {new Date(audit.created_at).toLocaleDateString()} • {audit.template_name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="bottom-nav">
        <button className="nav-item active" onClick={() => navigate('/')}>
          <i className="fas fa-home"></i>
          <span>Dashboard</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/audits')}>
          <i className="fas fa-clipboard-list"></i>
          <span>Audits</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/templates')}>
          <i className="fas fa-file-alt"></i>
          <span>Templates</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/settings')}>
          <i className="fas fa-cog"></i>
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
};

// Template Manager Component
const TemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const data = await db.getTemplates();
    setTemplates(data);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate({
      name: '',
      version: '1.0',
      questions: []
    });
    setShowEditor(true);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleSaveTemplate = async (template) => {
    if (template.id) {
      await db.updateTemplate(template.id, template);
    } else {
      await db.createTemplate(template);
    }
    setShowEditor(false);
    loadTemplates();
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      await db.deleteTemplate(id);
      loadTemplates();
    }
  };

  const exportToExcel = (template) => {
    // Implementation for Excel export
    alert('Excel export would be implemented here');
  };

  const importFromExcel = () => {
    // Implementation for Excel import
    alert('Excel import would be implemented here');
  };

  return (
    <div className="template-manager">
      <header className="app-header">
        <div className="header-content">
          <button onClick={() => navigate('/')} className="back-btn">
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Template Manager</h1>
          <div className="header-actions">
            <button onClick={importFromExcel} className="btn-secondary">
              <i className="fas fa-upload"></i> Import
            </button>
            <button onClick={handleCreateTemplate} className="btn-primary">
              <i className="fas fa-plus"></i> New
            </button>
          </div>
        </div>
      </header>

      <div className="template-content">
        {showEditor ? (
          <TemplateEditor
            template={editingTemplate}
            onSave={handleSaveTemplate}
            onCancel={() => setShowEditor(false)}
          />
        ) : (
          <div className="template-list">
            {templates.map(template => (
              <div key={template.id} className="template-card">
                <div className="template-header">
                  <h3>{template.name}</h3>
                  <span className="version">v{template.version}</span>
                </div>
                <div className="template-meta">
                  {template.questions.length} questions
                </div>
                <div className="template-actions">
                  <button onClick={() => handleEditTemplate(template)} className="btn-icon">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button onClick={() => exportToExcel(template)} className="btn-icon">
                    <i className="fas fa-download"></i>
                  </button>
                  <button onClick={() => handleDeleteTemplate(template.id)} className="btn-icon danger">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Template Editor Component
const TemplateEditor = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: template.name || '',
    version: template.version || '1.0',
    questions: template.questions || []
  });

  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          id: 'q-' + Date.now(),
          text: '',
          type: 'passfail',
          required: true
        }
      ]
    });
  };

  const handleUpdateQuestion = (index, updates) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleDeleteQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...template, ...formData });
  };

  return (
    <form onSubmit={handleSubmit} className="template-editor">
      <div className="form-group">
        <label>Template Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Version</label>
        <input
          type="text"
          value={formData.version}
          onChange={(e) => setFormData({ ...formData, version: e.target.value })}
          required
        />
      </div>

      <div className="questions-section">
        <div className="section-header">
          <h3>Questions</h3>
          <button type="button" onClick={handleAddQuestion} className="btn-secondary">
            <i className="fas fa-plus"></i> Add Question
          </button>
        </div>

        {formData.questions.map((question, index) => (
          <div key={question.id} className="question-editor">
            <div className="question-number">{index + 1}</div>
            <div className="question-content">
              <input
                type="text"
                placeholder="Enter question text"
                value={question.text}
                onChange={(e) => handleUpdateQuestion(index, { text: e.target.value })}
                required
              />
              <div className="question-options">
                <label>
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) => handleUpdateQuestion(index, { required: e.target.checked })}
                  />
                  Required
                </label>
                <button type="button" onClick={() => handleDeleteQuestion(index)} className="btn-icon danger">
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">Save Template</button>
      </div>
    </form>
  );
};

// New Audit Component
const NewAudit = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [location, setLocation] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const data = await db.getTemplates();
    setTemplates(data);
  };

  const handleStartAudit = async () => {
    if (!selectedTemplate || !location) {
      alert('Please select a template and enter location');
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    const audit = {
      template_id: selectedTemplate,
      template_name: template.name,
      location,
      user_id: user.id,
      status: 'pending',
      responses: {},
      photos: []
    };

    const newAudit = await db.createAudit(audit);
    navigate(`/audit/${newAudit.id}/conduct`);
  };

  return (
    <div className="new-audit">
      <header className="app-header">
        <div className="header-content">
          <button onClick={() => navigate('/')} className="back-btn">
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>New Audit</h1>
        </div>
      </header>

      <div className="new-audit-content">
        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            placeholder="Enter audit location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Select Template</label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            <option value="">Choose a template...</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name} (v{template.version})
              </option>
            ))}
          </select>
        </div>

        <button onClick={handleStartAudit} className="btn-primary btn-block">
          Start Audit
        </button>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/templates" element={user ? <TemplateManager /> : <Navigate to="/login" />} />
      <Route path="/audit/new" element={user ? <NewAudit /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

// CSS Styles
const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f5f7fa;
    color: #2c3e50;
  }

  /* Login Styles */
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .login-box {
    background: white;
    padding: 40px;
    border-radius: 10px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    width: 100%;
    max-width: 400px;
  }

  .login-header {
    text-align: center;
    margin-bottom: 30px;
  }

  .logo-icon {
    font-size: 48px;
    color: #667eea;
    margin-bottom: 10px;
  }

  .login-header h1 {
    font-size: 28px;
    margin-bottom: 5px;
  }

  .login-header p {
    color: #718096;
  }

  /* Form Styles */
  input, select, textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 16px;
    margin-bottom: 15px;
    transition: border-color 0.2s;
  }

  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #667eea;
  }

  /* Button Styles */
  .btn-primary, .btn-secondary {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
  }

  .btn-primary {
    background: #667eea;
    color: white;
  }

  .btn-primary:hover {
    background: #5a67d8;
    transform: translateY(-1px);
  }

  .btn-secondary {
    background: #e2e8f0;
    color: #4a5568;
  }

  .btn-secondary:hover {
    background: #cbd5e0;
  }

  .btn-icon {
    width: 36px;
    height: 36px;
    border: none;
    background: #f7fafc;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .btn-icon:hover {
    background: #e2e8f0;
  }

  .btn-icon.danger {
    color: #e53e3e;
  }

  .btn-large {
    padding: 16px 32px;
    font-size: 18px;
  }

  .btn-block {
    width: 100%;
  }

  /* Header Styles */
  .app-header {
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .back-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 5px;
    margin-right: 15px;
  }

  /* Dashboard Styles */
  .dashboard-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    padding-bottom: 80px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .stat-card {
    background: white;
    padding: 25px;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    text-align: center;
  }

  .stat-value {
    font-size: 36px;
    font-weight: bold;
    color: #667eea;
    margin-bottom: 5px;
  }

  .stat-label {
    color: #718096;
    font-size: 14px;
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }

  .recent-audits {
    background: white;
    padding: 25px;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .recent-audits h2 {
    margin-bottom: 20px;
  }

  .audit-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .audit-item {
    padding: 20px;
    background: #f7fafc;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .audit-item:hover {
    background: #e2e8f0;
    transform: translateX(5px);
  }

  .audit-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .audit-meta {
    color: #718096;
    font-size: 14px;
  }

  .status {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
  }

  .status-completed {
    background: #c6f6d5;
    color: #276749;
  }

  .status-pending {
    background: #fefcbf;
    color: #744210;
  }

  /* Bottom Navigation */
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
    display: flex;
    justify-content: space-around;
    padding: 10px 0;
    z-index: 100;
  }

  .nav-item {
    background: none;
    border: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 10px;
    cursor: pointer;
    color: #718096;
    transition: color 0.2s;
  }

  .nav-item.active {
    color: #667eea;
  }

  .nav-item i {
    font-size: 24px;
  }

  .nav-item span {
    font-size: 12px;
  }

  /* Template Manager Styles */
  .template-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .template-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .template-card {
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .template-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .version {
    background: #e2e8f0;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
  }

  .template-meta {
    color: #718096;
    font-size: 14px;
    margin-bottom: 15px;
  }

  .template-actions {
    display: flex;
    gap: 10px;
  }

  /* Template Editor Styles */
  .template-editor {
    background: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    max-width: 800px;
    margin: 0 auto;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #4a5568;
  }

  .questions-section {
    margin-top: 30px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .question-editor {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
    padding: 15px;
    background: #f7fafc;
    border-radius: 8px;
  }

  .question-number {
    width: 30px;
    height: 30px;
    background: #667eea;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    flex-shrink: 0;
  }

  .question-content {
    flex: 1;
  }

  .question-options {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 10px;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
  }

  /* New Audit Styles */
  .new-audit-content {
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
  }

  .empty-state {
    text-align: center;
    color: #718096;
    padding: 40px;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    font-size: 18px;
    color: #718096;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .quick-actions {
      grid-template-columns: 1fr;
    }
    
    .template-list {
      grid-template-columns: 1fr;
    }
  }
`;

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// Add Font Awesome
const fontAwesome = document.createElement("link");
fontAwesome.rel = "stylesheet";
fontAwesome.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
document.head.appendChild(fontAwesome);

export default App;