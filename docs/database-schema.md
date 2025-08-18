# 🗄️ Database Schema - FinanceSkills Hub

This document outlines the PostgreSQL database schema for the FinanceSkills Hub platform, organized by development milestones according to the feature roadmap.

## 📋 Table of Contents

- [Overview](#overview)
- [Schema by Development Phase](#schema-by-development-phase)
- [Key Database Features](#key-database-features)
- [Setup and Installation](#setup-and-installation)
- [Sample Data](#sample-data)

## 🔍 Overview

The database is designed to support a comprehensive financial education and portfolio simulation platform. It uses PostgreSQL with UUID primary keys, proper indexing for performance, and flexible JSONB fields for configuration storage.

## 🚀 Schema by Development Phase

### **MVP & Authentication (Weeks 1-2)**
Core user management and authentication system:

- **`users`** - User accounts with JWT session management
- **`user_sessions`** - Token tracking and session management
- **`user_preferences`** - User settings and customization preferences

### **Market Data & Dashboard (Weeks 3-4)**
Real-time and historical market data infrastructure:

- **`assets`** - Securities master data (stocks, crypto, ETFs, bonds)
- **`market_data`** - Real-time price caching for performance
- **`price_history`** - Historical price data for charting
- **`watchlists`** - Personalized asset tracking for dashboards

### **Portfolio Simulation (Weeks 5-6)**
Virtual trading and portfolio management:

- **`portfolios`** - Virtual portfolio management with multiple portfolios per user
- **`portfolio_holdings`** - Position tracking with cost basis and P&L
- **`transactions`** - Complete buy/sell transaction history
- Built-in profit/loss calculations and performance metrics

### **Analysis & Reporting (Weeks 7-8)**
Technical analysis and custom reporting:

- **`technical_indicators`** - Cached technical analysis (SMA, RSI, MACD, etc.)
- **`saved_analyses`** - Custom charts and reports with shareable configurations
- Support for risk metrics storage and portfolio analytics

### **Blog & CMS (Weeks 9-10)**
Content management system for educational content:

- **`blog_posts`** - Article content with rich text and media support
- **`blog_categories`** - Content organization and taxonomy
- Full SEO support with meta titles, descriptions, and tags
- Draft/published workflow for content management

### **Gamification (Weeks 11-12)**
Learning engagement and achievement system:

- **`achievements`** - Badge system with flexible criteria
- **`user_achievements`** - User progress tracking
- **`quizzes`** - Educational quiz system with multiple question types
- **`quiz_questions`** - Question bank with explanations
- **`user_quiz_attempts`** - Learning progress and scoring
- Integrated points system for user engagement

## ⚡ Key Database Features

### **Performance Optimizations**
- Strategic indexing on frequently queried columns
- Composite indexes for complex queries
- UUID primary keys for horizontal scaling
- Efficient caching tables for market data

### **Data Integrity**
- Foreign key constraints with appropriate cascade rules
- Unique constraints on critical business logic
- Automatic timestamp tracking with triggers
- Input validation through column constraints

### **Flexibility**
- JSONB fields for configuration storage
- Array support for tags and multi-value fields
- Extensible achievement criteria system
- Configurable dashboard layouts

### **Security**
- Password hashing support
- Session token management
- User permission levels
- Secure user data isolation

## 🛠️ Setup and Installation

### Prerequisites
- PostgreSQL 12+ 
- UUID extension support

### Installation Steps

1. **Apply the schema using Kubernetes:**
   ```bash
   kubectl apply -f k8s-manifests/postgres-init-sql-configmap.yaml
   kubectl apply -f k8s-manifests/postgres-deployment.yaml
   ```

2. **Or run directly in PostgreSQL:**
   ```sql
   \i path/to/init.sql
   ```

3. **Verify installation:**
   ```sql
   \dt  -- List all tables
   SELECT COUNT(*) FROM users;  -- Should return 0 initially
   ```

### Environment Variables
Ensure your application connects with appropriate database credentials:
- `DATABASE_URL` or separate `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

## 📊 Sample Data

The schema includes sample data to get you started:

### **Blog Categories**
- Investing Basics
- Market Analysis  
- Technology
- Personal Finance
- Cryptocurrency

### **Sample Assets**
- Major stocks (AAPL, GOOGL, MSFT, TSLA, AMZN)
- Cryptocurrencies (BTC, ETH)
- Popular ETFs (SPY, QQQ, VTI)

### **Achievement Examples**
- First Trade (50 points)
- Portfolio Builder (25 points)
- Quiz Master (100 points)
- Diversified Investor (75 points)
- Daily Trader (150 points)

### **Sample Quiz**
- "Basic Investment Concepts" with fundamental questions

## 🔄 Database Maintenance

### **Regular Tasks**
- Monitor `market_data` table size and implement data retention policies
- Clean up expired `user_sessions` periodically
- Backup `price_history` data regularly
- Optimize queries based on usage patterns

### **Scaling Considerations**
- Partition `price_history` table by date ranges for large datasets
- Consider read replicas for market data queries
- Implement caching layer (Redis) for frequently accessed data
- Monitor and optimize slow queries with `pg_stat_statements`

## 📈 Future Enhancements

The schema is designed to be extensible and can easily accommodate:
- Social features (user following, public portfolios)
- Advanced analytics (ML model predictions)
- Real account integration
- Multi-currency support
- Mobile app synchronization
- Third-party integrations

---

**Note:** This database schema supports the complete FinanceSkills Hub roadmap and is production-ready with proper indexing, constraints, and sample data for immediate development.