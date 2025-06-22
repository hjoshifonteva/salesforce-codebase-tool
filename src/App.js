import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  Upload, Folder, FileText, Search, Download, AlertCircle, CheckCircle, Loader,
  Code, Database, Users, Settings, Eye, Plus, Trash2, Play, Network, ChevronDown,
  ChevronRight, ArrowRight, Info, Zap, Filter
} from 'lucide-react';

// Minimal Apex Store implementation
class MinimalApexStore {
  constructor() {
    this.classes = [];
  }

  addClass(name) {
    const apexClass = { name: name, methods: [] };
    this.classes.push(apexClass);
  }

  addMethod(className, methodName, parameters, returnType, calls = [], expects = []) {
    for (const cls of this.classes) {
      if (cls.name === className) {
        cls.methods.push({
          name: methodName,
          parameters: parameters,
          return_type: returnType,
          calls: calls,
          expects: expects
        });
        break;
      }
    }
  }

  toJSON() {
    return { classes: this.classes };
  }

  fromJSON(data) {
    this.classes = data.classes || [];
  }

  clear() {
    this.classes = [];
  }
}

export default function SalesforceCodebaseApp() {
  // App state
  const [currentStep, setCurrentStep] = useState('processor');
  const [data, setData] = useState(null);

  // Processor state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [store] = useState(new MinimalApexStore());
  const [results, setResults] = useState(null);
  const [logs, setLogs] = useState([]);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // Explorer state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [expandedClasses, setExpandedClasses] = useState(new Set());
  const [filterType, setFilterType] = useState('all');

  // Comprehensive styles object - no external dependencies
  const styles = {
    // Base layout
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: '1.5',
      color: '#1a202c'
    },
    header: {
      backgroundColor: 'white',
      borderBottom: '1px solid #e2e8f0',
      padding: '1.5rem 2rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 10
    },
    title: {
      fontSize: '1.875rem',
      fontWeight: '700',
      color: '#1a202c',
      margin: 0,
      marginBottom: '0.5rem'
    },
    subtitle: {
      color: '#718096',
      fontSize: '1rem',
      margin: 0
    },

    // Navigation
    nav: {
      display: 'flex',
      gap: '0.5rem',
      marginTop: '1rem',
      flexWrap: 'wrap'
    },
    navButton: {
      padding: '0.75rem 1.5rem',
      border: 'none',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textDecoration: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    navButtonActive: {
      backgroundColor: '#3182ce',
      color: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    navButtonInactive: {
      backgroundColor: '#f7fafc',
      color: '#4a5568',
      border: '1px solid #e2e8f0'
    },

    // Content areas
    mainContent: {
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0'
    },

    // Form elements
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      backgroundColor: 'white',
      transition: 'border-color 0.2s ease',
      fontFamily: 'inherit'
    },
    inputFocus: {
      borderColor: '#3182ce',
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '0.5rem'
    },

    // Buttons
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1rem',
      border: 'none',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      textDecoration: 'none',
      transition: 'all 0.2s ease',
      fontFamily: 'inherit'
    },
    buttonPrimary: {
      backgroundColor: '#3182ce',
      color: 'white',
      boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)'
    },
    buttonSecondary: {
      backgroundColor: '#f7fafc',
      color: '#4a5568',
      border: '1px solid #e2e8f0'
    },
    buttonSuccess: {
      backgroundColor: '#059669',
      color: 'white',
      boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)'
    },
    buttonDanger: {
      backgroundColor: '#dc2626',
      color: 'white',
      boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)'
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },

    // Layout grids
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem'
    },
    gridTwo: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1.5rem'
    },

    // Badges and status indicators
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.25rem 0.75rem',
      fontSize: '0.75rem',
      fontWeight: '600',
      borderRadius: '1rem',
      marginRight: '0.5rem',
      marginBottom: '0.25rem'
    },
    badgeBlue: {
      backgroundColor: '#dbeafe',
      color: '#1e40af'
    },
    badgeGreen: {
      backgroundColor: '#dcfce7',
      color: '#166534'
    },
    badgeRed: {
      backgroundColor: '#fee2e2',
      color: '#991b1b'
    },
    badgeYellow: {
      backgroundColor: '#fef3c7',
      color: '#92400e'
    },
    badgePurple: {
      backgroundColor: '#e9d5ff',
      color: '#6b21a8'
    },

    // File list and items
    fileList: {
      maxHeight: '250px',
      overflowY: 'auto',
      border: '1px solid #e2e8f0',
      borderRadius: '0.5rem',
      backgroundColor: '#fafafa'
    },
    fileItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem',
      borderBottom: '1px solid #f1f5f9',
      transition: 'background-color 0.2s ease'
    },
    fileItemHover: {
      backgroundColor: '#f8fafc'
    },

    // Progress elements
    progressContainer: {
      backgroundColor: '#f1f5f9',
      borderRadius: '1rem',
      height: '0.75rem',
      overflow: 'hidden'
    },
    progressBar: {
      backgroundColor: '#059669',
      height: '100%',
      borderRadius: '1rem',
      transition: 'width 0.3s ease'
    },

    // Log display
    logContainer: {
      maxHeight: '300px',
      overflowY: 'auto',
      border: '1px solid #e2e8f0',
      borderRadius: '0.5rem',
      padding: '0.5rem',
      backgroundColor: '#fafafa'
    },
    logItem: {
      fontSize: '0.75rem',
      padding: '0.5rem',
      borderRadius: '0.25rem',
      marginBottom: '0.25rem',
      fontFamily: 'Monaco, Consolas, "Courier New", monospace'
    },
    logInfo: {
      backgroundColor: '#f8fafc',
      color: '#374151',
      borderLeft: '3px solid #6b7280'
    },
    logSuccess: {
      backgroundColor: '#f0fdf4',
      color: '#166534',
      borderLeft: '3px solid #059669'
    },
    logError: {
      backgroundColor: '#fef2f2',
      color: '#991b1b',
      borderLeft: '3px solid #dc2626'
    },

    // Explorer layout
    explorerMain: {
      display: 'flex',
      minHeight: 'calc(100vh - 200px)',
      gap: '0',
      backgroundColor: 'white',
      borderRadius: '0.75rem',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    sidebar: {
      width: '320px',
      backgroundColor: '#f8fafc',
      borderRight: '1px solid #e2e8f0',
      padding: '1.5rem',
      overflowY: 'auto',
      maxHeight: 'calc(100vh - 200px)'
    },
    explorerContent: {
      flex: 1,
      padding: '1.5rem 2rem',
      overflowY: 'auto',
      backgroundColor: 'white'
    },

    // Class and method items
    classItem: {
      padding: '0.75rem',
      marginBottom: '0.5rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: '1px solid transparent'
    },
    classItemSelected: {
      backgroundColor: '#ebf8ff',
      borderColor: '#3182ce',
      boxShadow: '0 2px 4px 0 rgba(59, 130, 246, 0.1)'
    },
    methodItem: {
      padding: '0.5rem 0.75rem',
      marginLeft: '1.5rem',
      marginBottom: '0.25rem',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      cursor: 'pointer',
      borderLeft: '2px solid #e2e8f0',
      transition: 'all 0.2s ease'
    },
    methodItemSelected: {
      backgroundColor: '#f0fff4',
      borderLeftColor: '#059669'
    },

    // Tabs
    tabContainer: {
      display: 'flex',
      borderBottom: '2px solid #f1f5f9',
      marginBottom: '1.5rem'
    },
    tab: {
      padding: '0.75rem 1.5rem',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      borderBottom: '2px solid transparent',
      fontWeight: '600',
      fontSize: '0.875rem',
      transition: 'all 0.2s ease',
      fontFamily: 'inherit'
    },
    tabActive: {
      borderBottomColor: '#3182ce',
      color: '#3182ce'
    },
    tabInactive: {
      color: '#6b7280'
    },

    // Statistics cards
    statCard: {
      backgroundColor: '#f8fafc',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid #e2e8f0',
      textAlign: 'center'
    },
    statNumber: {
      fontSize: '2.5rem',
      fontWeight: '800',
      lineHeight: '1',
      marginBottom: '0.5rem'
    },
    statLabel: {
      fontSize: '0.875rem',
      color: '#6b7280',
      fontWeight: '500'
    },

    // Responsive utilities
    responsiveHide: {
      display: window.innerWidth < 768 ? 'none' : 'block'
    },

    // Utility classes
    flexCenter: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    flexBetween: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    textCenter: {
      textAlign: 'center'
    },
    hidden: {
      display: 'none'
    }
  };

  // Add CSS animation for spin
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .spin { animation: spin 1s linear infinite; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  }, []);

  // File selection handlers
  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFolderSelect = useCallback(() => {
    folderInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event) => {
    const files = Array.from(event.target.files);
    const apexFiles = files.filter(file => {
      const name = file.name.toLowerCase();
      return name.endsWith('.cls') ||
             name.endsWith('.apex') ||
             (file.type === 'text/plain' && !name.includes('.')) ||
             file.type === '' ||
             file.type === 'application/octet-stream';
    });

    if (apexFiles.length === 0) {
      addLog(`No Apex files found. Looking for files ending in .cls`, 'error');
      addLog(`Found files: ${files.map(f => f.name).join(', ')}`, 'info');
    }

    setSelectedFiles(prev => {
      const existingPaths = new Set(prev.map(f => f.path));
      const newFiles = apexFiles.filter(file =>
        !existingPaths.has(file.webkitRelativePath || file.name)
      );

      if (newFiles.length > 0) {
        addLog(`Added ${newFiles.length} Apex files`, 'success');
      } else {
        addLog(`No new files added (${apexFiles.length} duplicates filtered)`, 'info');
      }

      return [...prev, ...newFiles.map(file => ({
        file,
        name: file.name,
        path: file.webkitRelativePath || file.name,
        processed: false
      }))];
    });

    event.target.value = '';
  }, [addLog]);

  const removeFile = useCallback((index) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      addLog(`Removed ${prev[index].name}`, 'info');
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, [addLog]);

  const clearAllFiles = useCallback(() => {
    setSelectedFiles([]);
    store.clear();
    setResults(null);
    setLogs([]);
    addLog('Cleared all files and results', 'info');
  }, [store, addLog]);

  // Gemini API call
  const callGeminiAPI = async (content, fileName) => {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }

    const prompt = `Analyze this Salesforce Apex class and create a compressed summary in the exact JSON format specified. Focus only on essential method information.

**Required JSON Format:**
{
  "name": "ClassName",
  "methods": [
    {
      "name": "methodName",
      "parameters": ["Type paramName", "Type paramName2"],
      "return_type": "ReturnType",
      "calls": ["MethodCall1", "MethodCall2"],
      "expects": ["Expectation or validation rule"]
    }
  ]
}

**Instructions:**
1. Extract only public and global methods (skip private unless critical)
2. For parameters: include type and name like "String accountId", "List<Account> accounts"
3. For calls: identify method calls to other classes like "DatabaseService.query", "ValidationUtils.validate"
4. For expects: extract validation rules, null checks, business rules from the method
5. Keep return_type simple: "void", "String", "List<Account>", etc.
6. Ignore getters/setters unless they contain business logic

**Apex Class Code:**
\`\`\`apex
${content}
\`\`\`

Return only the JSON object, no additional text or explanation.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response generated from API');
    }

    let jsonText = generatedText.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    try {
      const parsed = JSON.parse(jsonText);
      return parsed;
    } catch (parseError) {
      addLog(`JSON Parse Error for ${fileName}: ${parseError.message}`, 'error');
      addLog(`Raw response: ${jsonText}`, 'error');
      throw new Error(`Failed to parse JSON response: ${parseError.message}`);
    }
  };

  const processFiles = async () => {
    if (selectedFiles.length === 0) {
      addLog('No files selected for processing', 'error');
      return;
    }

    if (!apiKey.trim()) {
      addLog('Please enter your Gemini API key', 'error');
      return;
    }

    setProcessing(true);
    setProgress(0);
    store.clear();

    addLog(`Starting processing of ${selectedFiles.length} files`, 'info');

    for (let i = 0; i < selectedFiles.length; i++) {
      const fileInfo = selectedFiles[i];
      setCurrentFile(fileInfo.name);

      try {
        addLog(`Processing ${fileInfo.name}...`, 'info');

        const content = await fileInfo.file.text();
        const summary = await callGeminiAPI(content, fileInfo.name);

        store.addClass(summary.name);

        for (const method of summary.methods || []) {
          store.addMethod(
            summary.name,
            method.name,
            method.parameters || [],
            method.return_type || 'void',
            method.calls || [],
            method.expects || []
          );
        }

        setSelectedFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, processed: true } : f
        ));

        addLog(`✓ Processed ${fileInfo.name} - ${summary.methods?.length || 0} methods`, 'success');

        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        addLog(`✗ Error processing ${fileInfo.name}: ${error.message}`, 'error');
      }

      setProgress(((i + 1) / selectedFiles.length) * 100);
    }

    const finalResults = store.toJSON();
    setResults(finalResults);
    setProcessing(false);
    setCurrentFile('');
    addLog(`Processing complete! Generated summaries for ${store.classes.length} classes`, 'success');

    // Auto-download and switch to explorer
    downloadResults(finalResults);
    setTimeout(() => {
      setData(finalResults);
      setCurrentStep('explorer');
    }, 1000);
  };

  const downloadResults = (resultsData = results) => {
    if (!resultsData) return;

    const dataStr = JSON.stringify(resultsData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `apex_class_summaries_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    addLog(`Downloaded ${exportFileDefaultName}`, 'success');
  };

  // Explorer analysis logic
  const analysis = useMemo(() => {
    if (!data?.classes) return {};

    const totalClasses = data.classes.length;
    const totalMethods = data.classes.reduce((sum, cls) => sum + cls.methods.length, 0);

    const complexClasses = [...data.classes]
      .sort((a, b) => b.methods.length - a.methods.length)
      .slice(0, 5);

    const classConnections = {};
    data.classes.forEach(cls => {
      cls.methods.forEach(method => {
        method.calls.forEach(call => {
          const calledClass = call.split('.')[0];
          if (calledClass !== cls.name) {
            classConnections[cls.name] = (classConnections[cls.name] || 0) + 1;
          }
        });
      });
    });

    const mostConnected = Object.entries(classConnections)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const classesWithRules = data.classes.filter(cls =>
      cls.methods.some(method => method.expects && method.expects.length > 0)
    );

    return {
      totalClasses,
      totalMethods,
      complexClasses,
      mostConnected,
      classesWithRules
    };
  }, [data]);

  const filteredClasses = useMemo(() => {
    if (!data?.classes) return [];

    let filtered = data.classes;

    if (searchTerm) {
      filtered = filtered.filter(cls =>
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.methods.some(method =>
          method.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    switch (filterType) {
      case 'controllers':
        filtered = filtered.filter(cls => cls.name.includes('Controller'));
        break;
      case 'services':
        filtered = filtered.filter(cls => cls.name.includes('Service'));
        break;
      case 'utilities':
        filtered = filtered.filter(cls => cls.name.includes('Util'));
        break;
      case 'tests':
        filtered = filtered.filter(cls => cls.name.startsWith('Test_'));
        break;
      default:
        break;
    }

    return filtered;
  }, [data, searchTerm, filterType]);

  const toggleClassExpansion = (className) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(className)) {
      newExpanded.delete(className);
    } else {
      newExpanded.add(className);
    }
    setExpandedClasses(newExpanded);
  };

  const getClassDependencies = (className) => {
    if (!data?.classes) return { incoming: [], outgoing: [] };

    const targetClass = data.classes.find(cls => cls.name === className);
    if (!targetClass) return { incoming: [], outgoing: [] };

    const outgoing = new Set();
    const incoming = new Set();

    targetClass.methods.forEach(method => {
      method.calls.forEach(call => {
        const calledClass = call.split('.')[0];
        if (calledClass !== className) {
          outgoing.add(calledClass);
        }
      });
    });

    data.classes.forEach(cls => {
      if (cls.name !== className) {
        cls.methods.forEach(method => {
          method.calls.forEach(call => {
            const calledClass = call.split('.')[0];
            if (calledClass === className) {
              incoming.add(cls.name);
            }
          });
        });
      }
    });

    return {
      outgoing: Array.from(outgoing),
      incoming: Array.from(incoming)
    };
  };

  // Render processor step
  const renderProcessorStep = () => (
    <div style={styles.mainContent}>
      <div style={styles.card}>
        <h2 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#1a202c'}}>
          🤖 Process Apex Classes with AI
        </h2>
        <p style={{color: '#6b7280', marginBottom: '2rem'}}>
          Upload your Salesforce Apex classes and let AI analyze them to create compressed, searchable summaries.
        </p>

        {/* API Key Input */}
        <div style={{marginBottom: '2rem'}}>
          <label style={styles.label}>
            Gemini API Key
          </label>
          <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key..."
              style={{...styles.input, flex: 1, minWidth: '300px'}}
            />
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              style={{...styles.button, ...styles.buttonSecondary, textDecoration: 'none'}}
            >
              <Settings size={16} />
              Get API Key
            </a>
          </div>
        </div>

        <div style={window.innerWidth >= 768 ? styles.gridTwo : styles.grid}>
          {/* File Selection */}
          <div>
            <h3 style={{fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151'}}>
              📁 Select Apex Files
            </h3>

            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                <button
                  onClick={handleFileSelect}
                  style={{...styles.button, ...styles.buttonPrimary}}
                >
                  <Plus size={16} />
                  Select Files
                </button>

                <button
                  onClick={handleFolderSelect}
                  style={{...styles.button, ...styles.buttonSecondary}}
                >
                  <Folder size={16} />
                  Select Folder
                </button>

                {selectedFiles.length > 0 && (
                  <button
                    onClick={clearAllFiles}
                    style={{...styles.button, ...styles.buttonDanger}}
                  >
                    <Trash2 size={16} />
                    Clear All
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={styles.hidden}
                onChange={handleFileChange}
              />
              <input
                ref={folderInputRef}
                type="file"
                multiple
                webkitdirectory=""
                style={styles.hidden}
                onChange={handleFileChange}
              />

              <div style={{...styles.badge, ...styles.badgeBlue, width: 'fit-content'}}>
                📊 Selected: {selectedFiles.length} files
              </div>

              {/* File List */}
              {selectedFiles.length > 0 && (
                <div style={styles.fileList}>
                  {selectedFiles.map((fileInfo, index) => (
                    <div
                      key={index}
                      style={{
                        ...styles.fileItem,
                        ...(index === selectedFiles.length - 1 ? {borderBottom: 'none'} : {})
                      }}
                    >
                      <div style={{display: 'flex', alignItems: 'center', flex: 1, minWidth: 0}}>
                        <FileText size={16} style={{color: '#9ca3af', marginRight: '0.5rem', flexShrink: 0}} />
                        <span style={{fontSize: '0.875rem', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                          {fileInfo.path}
                        </span>
                        {fileInfo.processed && (
                          <CheckCircle size={16} style={{color: '#059669', marginLeft: '0.5rem', flexShrink: 0}} />
                        )}
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        style={{
                          padding: '0.25rem',
                          color: '#dc2626',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '0.25rem',
                          flexShrink: 0
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Process Button */}
              <button
                onClick={processFiles}
                disabled={processing || selectedFiles.length === 0 || !apiKey.trim()}
                style={{
                  ...styles.button,
                  ...styles.buttonSuccess,
                  width: '100%',
                  justifyContent: 'center',
                  padding: '1rem',
                  fontSize: '1rem',
                  ...(processing || selectedFiles.length === 0 || !apiKey.trim() ? styles.buttonDisabled : {})
                }}
              >
                {processing ? (
                  <>
                    <Loader size={20} className="spin" />
                    Processing... {Math.round(progress)}%
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    Process {selectedFiles.length} Files with Gemini AI
                  </>
                )}
              </button>

              {processing && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                  <div style={styles.progressContainer}>
                    <div style={{...styles.progressBar, width: `${progress}%`}}></div>
                  </div>
                  <div style={{fontSize: '0.875rem', color: '#6b7280', textAlign: 'center'}}>
                    Current: {currentFile}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Processing Logs */}
          <div>
            <h3 style={{fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151'}}>
              📝 Processing Logs
            </h3>
            <div style={styles.logContainer}>
              {logs.map((log, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.logItem,
                    ...(log.type === 'error' ? styles.logError :
                        log.type === 'success' ? styles.logSuccess :
                        styles.logInfo)
                  }}
                >
                  <span style={{color: '#9ca3af', fontWeight: '600'}}>[{log.timestamp}]</span> {log.message}
                </div>
              ))}
              {logs.length === 0 && (
                <div style={{color: '#9ca3af', textAlign: 'center', padding: '2rem', fontStyle: 'italic'}}>
                  Processing logs will appear here...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render explorer step
  const renderExplorerStep = () => {
    if (!data) return <div>No data loaded</div>;

    const renderOverview = () => (
      <div>
        <h2 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1a202c'}}>
          📊 Codebase Overview
        </h2>

        <div style={styles.grid}>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: '#3182ce'}}>
              {analysis.totalClasses}
            </div>
            <div style={styles.statLabel}>Total Classes</div>
          </div>

          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: '#059669'}}>
              {analysis.totalMethods}
            </div>
            <div style={styles.statLabel}>Total Methods</div>
          </div>

          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: '#dc2626'}}>
              {analysis.classesWithRules?.length || 0}
            </div>
            <div style={styles.statLabel}>Classes with Business Rules</div>
          </div>

          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: '#7c3aed'}}>
              {analysis.mostConnected?.length || 0}
            </div>
            <div style={styles.statLabel}>Highly Connected Classes</div>
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h3 style={{fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151'}}>
              🔥 Most Complex Classes
            </h3>
            {analysis.complexClasses?.map((cls, index) => (
              <div key={index} style={{marginBottom: '0.75rem', cursor: 'pointer'}} onClick={() => {setSelectedClass(cls); setActiveView('class-detail');}}>
                <div style={{fontWeight: '600', color: '#3182ce', marginBottom: '0.25rem'}}>
                  {cls.name}
                </div>
                <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                  {cls.methods.length} methods
                </div>
              </div>
            ))}
          </div>

          <div style={styles.card}>
            <h3 style={{fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151'}}>
              🔗 Most Connected Classes
            </h3>
            {analysis.mostConnected?.map(([className, connections], index) => (
              <div key={index} style={{marginBottom: '0.75rem', cursor: 'pointer'}} onClick={() => {
                const cls = data.classes.find(c => c.name === className);
                if (cls) { setSelectedClass(cls); setActiveView('class-detail'); }
              }}>
                <div style={{fontWeight: '600', color: '#3182ce', marginBottom: '0.25rem'}}>
                  {className}
                </div>
                <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                  {connections} external connections
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    const renderClassDetail = () => {
      if (!selectedClass) {
        return (
          <div style={styles.card}>
            <div style={styles.textCenter}>
              <Info size={48} style={{color: '#9ca3af', margin: '0 auto 1rem'}} />
              <h3 style={{color: '#6b7280', marginBottom: '0.5rem'}}>Select a class to view details</h3>
              <p style={{color: '#9ca3af'}}>Choose a class from the sidebar to explore its methods and dependencies</p>
            </div>
          </div>
        );
      }

      const dependencies = getClassDependencies(selectedClass.name);

      return (
        <div>
          <div style={{...styles.flexBetween, marginBottom: '1.5rem'}}>
            <h2 style={{fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#1a202c'}}>
              {selectedClass.name}
            </h2>
            <span style={{...styles.badge, ...styles.badgeBlue}}>
              {selectedClass.methods.length} methods
            </span>
          </div>

          <div style={styles.grid}>
            <div style={styles.card}>
              <h3 style={{fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151'}}>
                🔧 Methods
              </h3>
              {selectedClass.methods.length === 0 ? (
                <p style={{color: '#9ca3af', fontStyle: 'italic'}}>No methods found</p>
              ) : (
                selectedClass.methods.map((method, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '1rem',
                      marginBottom: '0.75rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setSelectedMethod(method)}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#f8fafc'}
                  >
                    <div style={{fontWeight: '600', marginBottom: '0.5rem', color: '#374151'}}>
                      {method.name}
                    </div>
                    <div style={{fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem'}}>
                      Returns: <code style={{backgroundColor: '#e5e7eb', padding: '0.125rem 0.25rem', borderRadius: '0.25rem'}}>{method.return_type}</code>
                    </div>
                    {method.parameters.length > 0 && (
                      <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                        Parameters: {method.parameters.length}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div style={styles.card}>
              <h3 style={{fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151'}}>
                🔗 Dependencies
              </h3>

              <div style={{marginBottom: '1.5rem'}}>
                <h4 style={{fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#4b5563'}}>
                  Depends on ({dependencies.outgoing.length}):
                </h4>
                {dependencies.outgoing.length === 0 ? (
                  <p style={{color: '#9ca3af', fontStyle: 'italic', fontSize: '0.875rem'}}>No external dependencies</p>
                ) : (
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                    {dependencies.outgoing.map((dep, index) => (
                      <span
                        key={index}
                        style={{...styles.badge, ...styles.badgeBlue, cursor: 'pointer'}}
                        onClick={() => {
                          const cls = data.classes.find(c => c.name === dep);
                          if (cls) setSelectedClass(cls);
                        }}
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 style={{fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#4b5563'}}>
                  Used by ({dependencies.incoming.length}):
                </h4>
                {dependencies.incoming.length === 0 ? (
                  <p style={{color: '#9ca3af', fontStyle: 'italic', fontSize: '0.875rem'}}>No incoming dependencies</p>
                ) : (
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                    {dependencies.incoming.map((dep, index) => (
                      <span
                        key={index}
                        style={{...styles.badge, ...styles.badgeGreen, cursor: 'pointer'}}
                        onClick={() => {
                          const cls = data.classes.find(c => c.name === dep);
                          if (cls) setSelectedClass(cls);
                        }}
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedMethod && (
            <div style={styles.card}>
              <h3 style={{fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151'}}>
                ⚙️ Method: {selectedMethod.name}
              </h3>

              <div style={styles.grid}>
                <div>
                  <div style={{marginBottom: '1rem'}}>
                    <strong>Parameters:</strong>
                    {selectedMethod.parameters.length === 0 ? (
                      <p style={{color: '#9ca3af', fontStyle: 'italic', margin: '0.5rem 0'}}>No parameters</p>
                    ) : (
                      <ul style={{margin: '0.5rem 0', paddingLeft: '1.5rem'}}>
                        {selectedMethod.parameters.map((param, index) => (
                          <li key={index} style={{marginBottom: '0.25rem', fontFamily: 'monospace'}}>
                            {param}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div style={{marginBottom: '1rem'}}>
                    <strong>Return Type:</strong>
                    <code style={{marginLeft: '0.5rem', backgroundColor: '#e5e7eb', padding: '0.25rem 0.5rem', borderRadius: '0.25rem'}}>
                      {selectedMethod.return_type}
                    </code>
                  </div>
                </div>

                <div>
                  {selectedMethod.calls.length > 0 && (
                    <div style={{marginBottom: '1rem'}}>
                      <strong>Method Calls:</strong>
                      <div style={{marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem'}}>
                        {selectedMethod.calls.map((call, index) => (
                          <span key={index} style={{...styles.badge, ...styles.badgePurple}}>
                            {call}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMethod.expects.length > 0 && (
                    <div>
                      <strong>Business Rules & Expectations:</strong>
                      <ul style={{margin: '0.5rem 0', paddingLeft: '1.5rem'}}>
                        {selectedMethod.expects.map((rule, index) => (
                          <li key={index} style={{marginBottom: '0.5rem', color: '#dc2626', fontWeight: '500'}}>
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div style={styles.explorerMain}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <h3 style={{fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151'}}>
            🔍 Browse Classes
          </h3>

          <input
            type="text"
            placeholder="Search classes and methods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{...styles.input, marginBottom: '1rem'}}
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{...styles.input, marginBottom: '1rem'}}
          >
            <option value="all">All Classes</option>
            <option value="controllers">Controllers</option>
            <option value="services">Services</option>
            <option value="utilities">Utilities</option>
            <option value="tests">Test Classes</option>
          </select>

          <div style={{...styles.badge, ...styles.badgeBlue, width: 'fit-content', marginBottom: '1rem'}}>
            📊 {filteredClasses.length} classes found
          </div>

          <div style={{maxHeight: 'calc(100vh - 400px)', overflowY: 'auto'}}>
            {filteredClasses.map((cls, index) => (
              <div key={index}>
                <div
                  style={{
                    ...styles.classItem,
                    ...(selectedClass?.name === cls.name ? styles.classItemSelected : {backgroundColor: 'white'})
                  }}
                  onClick={() => {
                    setSelectedClass(cls);
                    setActiveView('class-detail');
                    toggleClassExpansion(cls.name);
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    {expandedClasses.has(cls.name) ?
                      <ChevronDown size={16} style={{marginRight: '0.5rem', color: '#6b7280'}} /> :
                      <ChevronRight size={16} style={{marginRight: '0.5rem', color: '#6b7280'}} />
                    }
                    <div>
                      <div style={{fontWeight: '600', color: '#374151'}}>{cls.name}</div>
                      <div style={{fontSize: '0.75rem', color: '#9ca3af'}}>{cls.methods.length} methods</div>
                    </div>
                  </div>
                </div>

                {expandedClasses.has(cls.name) && cls.methods.map((method, methodIndex) => (
                  <div
                    key={methodIndex}
                    style={{
                      ...styles.methodItem,
                      ...(selectedMethod?.name === method.name ? styles.methodItemSelected : {backgroundColor: '#fafafa'})
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMethod(method);
                      setSelectedClass(cls);
                      setActiveView('class-detail');
                    }}
                  >
                    {method.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.explorerContent}>
          <div style={styles.tabContainer}>
            <button
              style={{
                ...styles.tab,
                ...(activeView === 'overview' ? styles.tabActive : styles.tabInactive)
              }}
              onClick={() => setActiveView('overview')}
            >
              📊 Overview
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeView === 'class-detail' ? styles.tabActive : styles.tabInactive)
              }}
              onClick={() => setActiveView('class-detail')}
            >
              🔍 Class Details
            </button>
          </div>

          {activeView === 'overview' && renderOverview()}
          {activeView === 'class-detail' && renderClassDetail()}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Salesforce Codebase Analyzer & Explorer</h1>
        <p style={styles.subtitle}>
          {currentStep === 'processor'
            ? 'Process your Apex classes with AI to generate compressed summaries'
            : `Exploring ${data?.classes?.length || 0} classes with ${analysis.totalMethods || 0} methods`
          }
        </p>

        <div style={styles.nav}>
          <button
            style={{
              ...styles.navButton,
              ...(currentStep === 'processor' ? styles.navButtonActive : styles.navButtonInactive)
            }}
            onClick={() => setCurrentStep('processor')}
          >
            <Upload size={16} />
            1. Process Files
          </button>
          <button
            style={{
              ...styles.navButton,
              ...(currentStep === 'explorer' ? styles.navButtonActive : styles.navButtonInactive),
              ...(data ? {} : {opacity: 0.5, cursor: 'not-allowed'})
            }}
            onClick={() => data && setCurrentStep('explorer')}
            disabled={!data}
          >
            <Search size={16} />
            2. Explore Codebase
          </button>
        </div>
      </div>

      {currentStep === 'processor' && renderProcessorStep()}
      {currentStep === 'explorer' && renderExplorerStep()}
    </div>
  );
}