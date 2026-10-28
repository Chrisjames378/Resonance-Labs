-- ==============================================================================
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
CREATE INDEX idx_telemetry_project_time ON telemetry_logs (project_id, timestamp DESC);
