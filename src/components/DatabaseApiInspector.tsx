import React, { useState } from 'react';
import { Database, Server, Copy, Check, Send, CreditCard, Code, RefreshCw, Download, FileJson } from 'lucide-react';
import { triggerPaypalWebhook, registerInterest, commitModel, fetchTelemetry } from '../services/api.ts';

const POSTGRESQL_DDL = `-- ==============================================================================
-- MODULE 1: RELATIONAL DATABASE ARCHITECTURE (PostgreSQL)
-- RESONANCE LABS UNIFIED DATA PERSISTENCE LAYER
-- ==============================================================================

-- Enable UUID extension for secure, non-sequential system identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Multi-Tenant User Profiles & Account Licensing Table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    paypal_customer_id VARCHAR(100) UNIQUE,
    paypal_subscription_id VARCHAR(100) UNIQUE,
    subscription_tier VARCHAR(50) DEFAULT 'hobby' CHECK (subscription_tier IN ('hobby', 'pro', 'enterprise')),
    billing_status VARCHAR(50) DEFAULT 'INACTIVE' CHECK (billing_status IN ('ACTIVE', 'SUSPENDED', 'CANCELLED', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. AI Model Projects Topology Table
CREATE TABLE ai_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Autonomous Engine Prototype',
    network_architecture JSONB NOT NULL, -- Statically preserves complete structural layer chains
    learning_rate NUMERIC(6,5) DEFAULT 0.001,
    batch_size INT DEFAULT 32,
    empathy_factor NUMERIC(3,2) DEFAULT 0.85,
    metacognition_factor NUMERIC(3,2) DEFAULT 0.90,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. High-Throughput Metacognitive System Logs Table
CREATE TABLE telemetry_logs (
    id BIGSERIAL PRIMARY KEY,
    project_id UUID REFERENCES ai_projects(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    task_loss NUMERIC(7,5) NOT NULL,
    task_accuracy NUMERIC(5,4) NOT NULL,
    metacognitive_confidence NUMERIC(5,4) NOT NULL,
    inner_monologue_snapshot TEXT,
    tokens_per_second NUMERIC(6,2),
    hardware_thread_efficiency INT
);

-- Create performant indexes to handle high-frequency dashboard telemetry lookups
CREATE INDEX idx_telemetry_project_time ON telemetry_logs (project_id, timestamp DESC);`;

interface ProjectConfig {
  id: string;
  userId: string;
  name: string;
  learning_rate: number;
  batch_size: number;
  empathy_factor: number;
  metacognition_factor: number;
  network_architecture: Array<{
    id: string;
    name: string;
    type: string;
    nodes: number;
    activation: string;
    dropout?: number;
  }>;
  metacognitive_settings: {
    reflectionLoopback: boolean;
    confidenceFloorThreshold: number;
    sampleWindowIntervalMs: number;
  };
  created_at: string;
}

const INITIAL_PROJECTS: ProjectConfig[] = [
  {
    id: 'proj_8e31a0',
    userId: 'usr_001_demo',
    name: 'Autonomous Audio Core Hybrid',
    learning_rate: 0.001,
    batch_size: 32,
    empathy_factor: 0.85,
    metacognition_factor: 0.90,
    network_architecture: [
      { id: 'l1', name: 'Input Vector', type: 'Input', nodes: 128, activation: 'Linear' },
      { id: 'l2', name: 'Dense Feature Extractor', type: 'Dense', nodes: 256, activation: 'ReLU' },
      { id: 'l3', name: 'Metacognitive Critic Node', type: 'MetacognitiveCritic', nodes: 64, activation: 'Sigmoid' },
      { id: 'l4', name: 'Synthesized Softmax Head', type: 'Output', nodes: 10, activation: 'Softmax' }
    ],
    metacognitive_settings: {
      reflectionLoopback: true,
      confidenceFloorThreshold: 0.85,
      sampleWindowIntervalMs: 100
    },
    created_at: '2026-10-27T14:30:00Z'
  },
  {
    id: 'proj_4c19f2',
    userId: 'usr_001_demo',
    name: 'Low-Latency Speech Synthesis Weights',
    learning_rate: 0.0005,
    batch_size: 64,
    empathy_factor: 0.92,
    metacognition_factor: 0.95,
    network_architecture: [
      { id: 'l1', name: 'Audio Frame Input', type: 'Input', nodes: 80, activation: 'Linear' },
      { id: 'l2', name: 'Multi-Head Attention', type: 'Attention', nodes: 256, activation: 'GELU' },
      { id: 'l3', name: 'Conv1D Filter Bank', type: 'Conv1D', nodes: 128, activation: 'ReLU' },
      { id: 'l4', name: 'Critic Verification Head', type: 'MetacognitiveCritic', nodes: 64, activation: 'Sigmoid' },
      { id: 'l5', name: 'Waveform Head', type: 'Output', nodes: 256, activation: 'Softmax' }
    ],
    metacognitive_settings: {
      reflectionLoopback: true,
      confidenceFloorThreshold: 0.90,
      sampleWindowIntervalMs: 50
    },
    created_at: '2026-10-27T15:10:00Z'
  }
];

export const DatabaseApiInspector: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schema' | 'tables' | 'api' | 'billing'>('tables');
  const [copied, setCopied] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [projects, setProjects] = useState<ProjectConfig[]>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(INITIAL_PROJECTS[0].id);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  
  // Currently viewed project configuration object
  const currentlyViewedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // API Test states
  const [apiResponse, setApiResponse] = useState<string>('Select an API route to test live gateway responses.');
  const [latestCommittedConfig, setLatestCommittedConfig] = useState<any | null>(null);
  const [testEmail, setTestEmail] = useState('developer@resonance.ai');
  const [currentTier, setCurrentTier] = useState<'hobby' | 'pro' | 'enterprise'>('pro');
  const [billingStatus, setBillingStatus] = useState<'ACTIVE' | 'CANCELLED' | 'SUSPENDED'>('ACTIVE');

  const handleCopySchema = () => {
    navigator.clipboard.writeText(POSTGRESQL_DDL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Copies raw JSON configuration of the currently viewed project to clipboard
   */
  const handleCopyCurrentlyViewedJson = () => {
    if (!currentlyViewedProject) return;
    const jsonString = JSON.stringify(currentlyViewedProject, null, 2);
    navigator.clipboard.writeText(jsonString);
    setCopiedConfig(true);
    setExportNotice(
      `Copied raw JSON configuration for "${currentlyViewedProject.name}" to clipboard.`
    );
    setTimeout(() => {
      setCopiedConfig(false);
      setExportNotice(null);
    }, 3000);
  };

  /**
   * Serializes the currently viewed project configuration object and triggers a browser download
   */
  const handleDownloadCurrentlyViewedJson = () => {
    if (!currentlyViewedProject) return;
    const jsonString = JSON.stringify(currentlyViewedProject, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${currentlyViewedProject.id}_configuration.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    setExportNotice(
      `Serialized and downloaded configuration for "${currentlyViewedProject.name}" (${currentlyViewedProject.id}) as JSON.`
    );
    setTimeout(() => setExportNotice(null), 5000);
  };

  /**
   * Exports project configuration(s) as a downloadable JSON file
   */
  const handleDownloadProjectsJson = (projectToExport?: ProjectConfig) => {
    const exportBundle = {
      format: 'ResonanceLabs.AIProjectsTopology.v1',
      exportedAt: new Date().toISOString(),
      platform: 'Resonance Labs Computational Metacognition R&D',
      schemaCompliance: 'PostgreSQL Module 1 ai_projects JSONB',
      projects: projectToExport ? [projectToExport] : projects
    };

    const jsonString = JSON.stringify(exportBundle, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    const fileName = projectToExport
      ? `resonance_project_${projectToExport.id}_config.json`
      : `resonance_project_configurations_${Date.now()}.json`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    setExportNotice(
      `Exported ${projectToExport ? `"${projectToExport.name}"` : `${projects.length} project configuration(s)`} as ${fileName}`
    );
    setTimeout(() => setExportNotice(null), 5000);
  };

  const handleTestRegister = async () => {
    setApiResponse('Sending POST /api/auth/register-interest ...');
    const res = await registerInterest(testEmail);
    setApiResponse(JSON.stringify(res, null, 2));
  };

  const handleTestTelemetry = async () => {
    setApiResponse('Sending GET /api/v1/telemetry/stream/proj_default ...');
    const res = await fetchTelemetry('proj_default');
    setApiResponse(JSON.stringify(res, null, 2));
  };

  const handleTestCommit = async () => {
    setApiResponse('Sending POST /api/v1/studio/commit-model ...');
    const newConfigData = {
      userId: 'usr_inspector_session',
      name: 'Dynamic Audio Engine (PostgreSQL Synced)',
      layers: [
        { id: 'l1', name: 'Input Vector', type: 'Input', nodes: 128, activation: 'Linear' },
        { id: 'l2', name: 'Metacognitive Critic Node', type: 'MetacognitiveCritic', nodes: 64, activation: 'Sigmoid' },
        { id: 'l3', name: 'Synthesized Softmax Head', type: 'Output', nodes: 10, activation: 'Softmax' }
      ],
      learningRate: 0.001,
      batchSize: 32,
      empathyFactor: 0.85,
      metacognitionFactor: 0.90
    };

    const res = await commitModel(newConfigData);
    setApiResponse(JSON.stringify(res, null, 2));
    
    if (res.data) {
      setLatestCommittedConfig(res.data);
      const newProject: ProjectConfig = {
        id: res.data.projectId || `proj_${Date.now()}`,
        userId: res.data.userId || 'usr_inspector_session',
        name: res.data.name || newConfigData.name,
        learning_rate: res.data.hyperparameters?.learningRate || newConfigData.learningRate,
        batch_size: res.data.hyperparameters?.batchSize || newConfigData.batchSize,
        empathy_factor: res.data.hyperparameters?.empathyFactor || newConfigData.empathyFactor,
        metacognition_factor: res.data.hyperparameters?.metacognitionFactor || newConfigData.metacognitionFactor,
        network_architecture: res.data.layers || newConfigData.layers,
        metacognitive_settings: res.data.metacognitiveSettings || {
          reflectionLoopback: true,
          confidenceFloorThreshold: 0.85,
          sampleWindowIntervalMs: 100
        },
        created_at: res.data.deployedAt || new Date().toISOString()
      };
      setProjects(prev => [newProject, ...prev]);
    }
  };

  const handleTestPaypal = async (eventType: string) => {
    setApiResponse(`Sending POST /api/v1/billing/paypal-webhook [${eventType}] ...`);
    const res = await triggerPaypalWebhook(eventType, `sub_paypal_${Date.now()}`);
    if (eventType.includes('CANCEL')) {
      setBillingStatus('CANCELLED');
    } else {
      setBillingStatus('ACTIVE');
    }
    setApiResponse(JSON.stringify(res, null, 2));
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-400" />
            Database & API Gateway Architecture
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Explore the multi-tenant PostgreSQL schema (DDL), inspect live tables, and test the Express Node.js gateway endpoints.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded">
          {[
            { id: 'tables', label: 'Relational Tables' },
            { id: 'schema', label: 'PostgreSQL DDL' },
            { id: 'api', label: 'API Tester' },
            { id: 'billing', label: 'PayPal Billing Loop' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* View 1: Relational Tables Preview */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          
          {/* Export Notification Banner */}
          {exportNotice && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-600 rounded flex items-center justify-between text-xs font-mono text-emerald-300 animate-fadeIn">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{exportNotice}</span>
              </div>
              <span className="text-[11px] text-emerald-400/80">File downloaded to client system</span>
            </div>
          )}

          {/* Table 1: user_profiles */}
          <div className="border border-slate-800 bg-slate-900/60 rounded overflow-hidden">
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-200 font-semibold">Table 1: user_profiles (Multi-Tenant Accounts)</span>
              <span className="text-emerald-400">UUID Primary Keys</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                    <th className="py-2.5 px-4 font-semibold">id (UUID)</th>
                    <th className="py-2.5 px-4 font-semibold">email</th>
                    <th className="py-2.5 px-4 font-semibold">paypal_subscription_id</th>
                    <th className="py-2.5 px-4 font-semibold">subscription_tier</th>
                    <th className="py-2.5 px-4 font-semibold">billing_status</th>
                    <th className="py-2.5 px-4 font-semibold">created_at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr className="hover:bg-slate-900/80">
                    <td className="py-3 px-4 text-emerald-400 font-bold">a7f10b24-9c12-4f88-990a-1e42a98f1234</td>
                    <td className="py-3 px-4 text-slate-200">lead.researcher@mit.edu</td>
                    <td className="py-3 px-4 text-slate-400">I-BW0K948D4U6E</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">enterprise</span>
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">ACTIVE</td>
                    <td className="py-3 px-4 text-slate-400">2026-10-24 14:22:10 UTC</td>
                  </tr>
                  <tr className="hover:bg-slate-900/80">
                    <td className="py-3 px-4 text-emerald-400 font-bold">c3b48201-11d4-4a29-b003-9031ef0021bc</td>
                    <td className="py-3 px-4 text-slate-200">audio.architect@resonance.ai</td>
                    <td className="py-3 px-4 text-slate-400">I-LP8932KN7912</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300">pro</span>
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">ACTIVE</td>
                    <td className="py-3 px-4 text-slate-400">2026-10-25 09:15:30 UTC</td>
                  </tr>
                  <tr className="hover:bg-slate-900/80">
                    <td className="py-3 px-4 text-emerald-400 font-bold">f1e94411-88bb-4770-a109-7719cc11880a</td>
                    <td className="py-3 px-4 text-slate-200">student.dev@stanford.edu</td>
                    <td className="py-3 px-4 text-slate-500">NULL</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">hobby</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">INACTIVE</td>
                    <td className="py-3 px-4 text-slate-400">2026-10-27 11:04:12 UTC</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: ai_projects with JSON Export Feature */}
          <div className="border border-slate-800 bg-slate-900/60 rounded overflow-hidden">
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-200 font-semibold">Table 2: ai_projects (Topology & Hyperparameters)</span>
                <span className="text-slate-500">·</span>
                <span className="text-cyan-400">{projects.length} Registered Configurations</span>
              </div>
              
              {/* Primary JSON Export Action */}
              <button
                onClick={() => handleDownloadProjectsJson()}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded transition-colors flex items-center gap-1.5 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title="Download all project topologies and hyperparameter matrices as JSON"
              >
                <Download className="w-3.5 h-3.5" />
                Export Configurations (JSON)
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                    <th className="py-2.5 px-4 font-semibold">id</th>
                    <th className="py-2.5 px-4 font-semibold">name</th>
                    <th className="py-2.5 px-4 font-semibold">learning_rate</th>
                    <th className="py-2.5 px-4 font-semibold">batch_size</th>
                    <th className="py-2.5 px-4 font-semibold">empathy_factor</th>
                    <th className="py-2.5 px-4 font-semibold">metacognition_factor</th>
                    <th className="py-2.5 px-4 font-semibold">network_architecture (JSONB)</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {projects.map((proj) => {
                    const isSelected = selectedProjectId === proj.id;
                    return (
                      <tr
                        key={proj.id}
                        onClick={() => setSelectedProjectId(proj.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-950/30 ring-1 ring-inset ring-emerald-500/40'
                            : 'hover:bg-slate-900/80'
                        }`}
                      >
                        <td className="py-3 px-4 text-cyan-400 font-bold whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                            <span>{proj.id}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-200 whitespace-nowrap font-medium">{proj.name}</td>
                        <td className="py-3 px-4 tabular-nums">{proj.learning_rate.toFixed(5)}</td>
                        <td className="py-3 px-4 tabular-nums">{proj.batch_size}</td>
                        <td className="py-3 px-4 tabular-nums text-emerald-400">{proj.empathy_factor.toFixed(2)}</td>
                        <td className="py-3 px-4 tabular-nums text-emerald-400">{proj.metacognition_factor.toFixed(2)}</td>
                        <td className="py-3 px-4 text-slate-400 truncate max-w-xs">
                          {`[${proj.network_architecture.map(l => `${l.name} (${l.nodes})`).join(', ')}]`}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProjectId(proj.id);
                              handleDownloadProjectsJson(proj);
                            }}
                            className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-emerald-300 rounded transition-colors inline-flex items-center gap-1.5 font-mono text-xs"
                            title={`Download JSON for ${proj.name}`}
                          >
                            <Download className="w-3 h-3 text-emerald-400" />
                            <span>Download JSON</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dedicated Currently Viewed Project Configuration Inspector with 'Download JSON' Button */}
          {currentlyViewedProject && (
            <div className="border border-slate-800 bg-slate-900/80 rounded overflow-hidden shadow-lg space-y-0">
              <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400">
                    <FileJson className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Currently Viewed Configuration:</span>
                      <span className="text-sm font-bold text-slate-100">{currentlyViewedProject.name}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      ID: <span className="text-cyan-400">{currentlyViewedProject.id}</span> · Layers: {currentlyViewedProject.network_architecture.length} · Learning Rate: {currentlyViewedProject.learning_rate}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Select other projects dropdown */}
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
                    aria-label="Select viewed project"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id})
                      </option>
                    ))}
                  </select>

                  {/* Copy to Clipboard Button for Raw JSON Configuration */}
                  <button
                    onClick={handleCopyCurrentlyViewedJson}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-500 font-semibold rounded text-xs font-mono transition-colors flex items-center gap-1.5 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0"
                    title="Copy raw JSON configuration to clipboard for quick sharing or local backup"
                  >
                    {copiedConfig ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy to Clipboard</span>
                      </>
                    )}
                  </button>

                  {/* Primary 'Download JSON' Button for Currently Viewed Configuration */}
                  <button
                    onClick={handleDownloadCurrentlyViewedJson}
                    className="px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded text-xs font-mono transition-colors flex items-center gap-2 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0"
                    title="Download serialized JSON for currently viewed project configuration"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON</span>
                  </button>
                </div>
              </div>

              {/* Serialized JSON Viewer Preview */}
              <div className="p-4 bg-slate-950/90 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px] mb-2 pb-1 border-b border-slate-900">
                  <span>Serialized Object Preview (`ai_projects` row JSONB)</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCurrentlyViewedJson}
                      className="text-xs font-mono text-slate-300 hover:text-emerald-400 flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-slate-900 border border-slate-800"
                      title="Copy raw JSON to clipboard"
                    >
                      {copiedConfig ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      <span>{copiedConfig ? 'Copied' : 'Copy'}</span>
                    </button>
                    <span className="text-slate-600">·</span>
                    <span className="text-emerald-400">Ready for quick sharing & local backup</span>
                  </div>
                </div>
                <pre className="p-3 bg-slate-900 rounded border border-slate-800 text-emerald-300 text-xs overflow-x-auto max-h-64 leading-relaxed">
                  <code>{JSON.stringify(currentlyViewedProject, null, 2)}</code>
                </pre>
              </div>
            </div>
          )}

        </div>
      )}

      {/* View 2: PostgreSQL DDL Script */}
      {activeTab === 'schema' && (
        <div className="border border-slate-800 bg-slate-950 rounded overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              database/schema.sql
            </span>
            <button
              onClick={handleCopySchema}
              className="px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to Clipboard' : 'Copy SQL Schema'}
            </button>
          </div>
          <div className="p-4 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-[500px]">
            <pre>
              <code>{POSTGRESQL_DDL}</code>
            </pre>
          </div>
        </div>
      )}

      {/* View 3: API Gateway Tester */}
      {activeTab === 'api' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 bg-slate-900/80 border border-slate-800 rounded space-y-3">
              <span className="text-xs font-mono text-slate-300 font-semibold block">
                Express Route Prober
              </span>

              <div className="space-y-2">
                <button
                  onClick={handleTestRegister}
                  className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-left rounded text-xs font-mono text-slate-200 transition-colors flex items-center justify-between"
                >
                  <span className="text-emerald-400 font-bold">POST</span>
                  <span>/api/auth/register-interest</span>
                  <Send className="w-3 h-3 text-slate-500" />
                </button>

                <button
                  onClick={handleTestTelemetry}
                  className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-left rounded text-xs font-mono text-slate-200 transition-colors flex items-center justify-between"
                >
                  <span className="text-cyan-400 font-bold">GET</span>
                  <span>/api/v1/telemetry/stream/:projectId</span>
                  <RefreshCw className="w-3 h-3 text-slate-500" />
                </button>

                <button
                  onClick={handleTestCommit}
                  className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-left rounded text-xs font-mono text-slate-200 transition-colors flex items-center justify-between"
                >
                  <span className="text-emerald-400 font-bold">POST</span>
                  <span>/api/v1/studio/commit-model</span>
                  <Send className="w-3 h-3 text-slate-500" />
                </button>

                <button
                  onClick={() => handleTestPaypal('BILLING.SUBSCRIPTION.ACTIVATED')}
                  className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-left rounded text-xs font-mono text-slate-200 transition-colors flex items-center justify-between"
                >
                  <span className="text-purple-400 font-bold">POST</span>
                  <span>/api/v1/billing/paypal-webhook</span>
                  <CreditCard className="w-3 h-3 text-slate-500" />
                </button>
              </div>

              <div className="pt-2">
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Registration Email Input</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="p-5 bg-slate-950 border border-slate-800 rounded space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono">
                <span className="text-slate-400">Gateway Response Payload</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">HTTP 200 OK</span>
                  {latestCommittedConfig && (
                    <button
                      onClick={() => handleDownloadProjectsJson(projects[0])}
                      className="px-2 py-0.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded text-[11px] flex items-center gap-1 transition-colors"
                      title="Download latest committed project configuration as JSON"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span>Download Config JSON</span>
                    </button>
                  )}
                </div>
              </div>
              <pre className="p-3 bg-slate-900 rounded text-xs font-mono text-slate-200 overflow-x-auto max-h-80">
                <code>{apiResponse}</code>
              </pre>
            </div>
          </div>

        </div>
      )}

      {/* View 4: PayPal Billing Simulator */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Hobby Tier */}
            <div className={`p-5 rounded border ${
              currentTier === 'hobby'
                ? 'bg-slate-900/90 border-slate-700'
                : 'bg-slate-900/40 border-slate-800'
            }`}>
              <div className="text-xs font-mono text-slate-400 uppercase">Tier: Hobby</div>
              <div className="text-2xl font-bold text-slate-100 mt-1">$0<span className="text-xs font-normal text-slate-400">/mo</span></div>
              <p className="text-xs text-slate-400 mt-2">
                For researchers and students learning computational metacognition.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-slate-300 space-y-1">
                <div>· Local WebGPU inference</div>
                <div>· 50,000 monthly tokens</div>
                <div>· Community Discord support</div>
              </div>
              <button
                onClick={() => setCurrentTier('hobby')}
                className="mt-6 w-full py-2 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                {currentTier === 'hobby' ? 'Current Tier' : 'Select Hobby'}
              </button>
            </div>

            {/* Pro Tier */}
            <div className={`p-5 rounded border ${
              currentTier === 'pro'
                ? 'bg-emerald-950/20 border-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                : 'bg-slate-900/40 border-slate-800'
            }`}>
              <div className="text-xs font-mono text-emerald-400 uppercase">Tier: Pro Developer</div>
              <div className="text-2xl font-bold text-slate-100 mt-1">$49<span className="text-xs font-normal text-slate-400">/mo</span></div>
              <p className="text-xs text-slate-400 mt-2">
                For production AI engineers building high-throughput Actor-Critic pipelines.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-slate-300 space-y-1">
                <div>· Multi-Model Router active</div>
                <div>· Unlimited local WebGPU runs</div>
                <div>· 2,000,000 cloud tokens/mo</div>
                <div>· Dedicated PostgreSQL sync</div>
              </div>
              <button
                onClick={() => {
                  setCurrentTier('pro');
                  handleTestPaypal('BILLING.SUBSCRIPTION.ACTIVATED');
                }}
                className="mt-6 w-full py-2 text-xs font-semibold rounded bg-emerald-400 hover:bg-emerald-300 text-slate-950 transition-colors"
              >
                {currentTier === 'pro' ? 'Active PayPal Subscription' : 'Simulate PayPal Subscribe'}
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className={`p-5 rounded border ${
              currentTier === 'enterprise'
                ? 'bg-cyan-950/20 border-cyan-600'
                : 'bg-slate-900/40 border-slate-800'
            }`}>
              <div className="text-xs font-mono text-cyan-400 uppercase">Tier: Enterprise Cluster</div>
              <div className="text-2xl font-bold text-slate-100 mt-1">Custom</div>
              <p className="text-xs text-slate-400 mt-2">
                For laboratories requiring dedicated cluster hardware and strict SLAs.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-slate-300 space-y-1">
                <div>· Dedicated TPU/GPU nodes</div>
                <div>· Custom inner monologue logic</div>
                <div>· HIPAA / SOC-2 compliance</div>
                <div>· 24/7 dedicated engineering SLA</div>
              </div>
              <button
                onClick={() => setCurrentTier('enterprise')}
                className="mt-6 w-full py-2 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Contact Resonance Sales
              </button>
            </div>

          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded flex items-center justify-between text-xs font-mono text-slate-400">
            <div>
              <span>Active Billing Status: </span>
              <strong className={billingStatus === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'}>
                {billingStatus}
              </strong>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleTestPaypal('BILLING.SUBSCRIPTION.CANCELLED')}
                className="px-2.5 py-1 text-[11px] bg-rose-950/40 text-rose-300 border border-rose-800 rounded hover:bg-rose-900/60 transition-colors"
              >
                Trigger Cancellation Webhook
              </button>
              <button
                onClick={() => handleTestPaypal('BILLING.SUBSCRIPTION.ACTIVATED')}
                className="px-2.5 py-1 text-[11px] bg-emerald-950/40 text-emerald-300 border border-emerald-800 rounded hover:bg-emerald-900/60 transition-colors"
              >
                Trigger Activation Webhook
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
