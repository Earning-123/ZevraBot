import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApiClient } from './src/services/apiClient';
import { MarketDataService } from './src/services/marketData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'UP',
      service: 'ZevraBot Core Engine',
      timestamp: Date.now(),
      invariants: {
        platformLeverageCap: 10,
        withdrawalBanned: true,
        highWaterMark: 'ACTIVE',
        performanceFeePercent: 30,
      },
    });
  });

  app.get('/api/user', async (_req, res) => {
    const user = await ApiClient.getCurrentUser();
    res.json(user);
  });

  app.get('/api/exchanges', async (_req, res) => {
    const list = await ApiClient.getExchanges();
    res.json(list);
  });

  app.post('/api/exchanges/validate', async (req, res) => {
    try {
      const result = await ApiClient.validateAndSaveApiKey(req.body);
      res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      res.status(400).json({ success: false, message: msg });
    }
  });

  app.get('/api/markets', async (_req, res) => {
    const tickers = await ApiClient.getTickers();
    res.json(tickers);
  });

  app.get('/api/markets/:symbol', async (req, res) => {
    const ticker = await ApiClient.getTicker(req.params.symbol);
    res.json(ticker);
  });

  app.get('/api/strategies', async (_req, res) => {
    const strats = await ApiClient.getStrategies();
    res.json(strats);
  });

  app.get('/api/strategies/evaluate/:symbol', async (req, res) => {
    const result = await ApiClient.evaluateMarket(req.params.symbol);
    res.json(result);
  });

  app.get('/api/risk/config', async (_req, res) => {
    const cfg = await ApiClient.getRiskConfig();
    res.json(cfg);
  });

  app.post('/api/risk/config', async (req, res) => {
    const cfg = await ApiClient.updateRiskConfig(req.body);
    res.json(cfg);
  });

  app.get('/api/risk/kill-switch', async (_req, res) => {
    const ks = await ApiClient.getKillSwitches();
    res.json(ks);
  });

  app.post('/api/risk/kill-switch/user', async (req, res) => {
    const ks = await ApiClient.triggerUserKillSwitch(req.body.active);
    res.json(ks);
  });

  app.post('/api/risk/kill-switch/global', async (req, res) => {
    const ks = await ApiClient.triggerGlobalKillSwitch(req.body.active);
    res.json(ks);
  });

  app.get('/api/positions', async (_req, res) => {
    const pos = await ApiClient.getPositions();
    res.json(pos);
  });

  app.post('/api/positions/close', async (req, res) => {
    const result = await ApiClient.closePosition(req.body.positionId);
    res.json(result);
  });

  app.post('/api/positions/emergency-close-all', async (_req, res) => {
    const count = await ApiClient.emergencyCloseAll();
    res.json({ success: true, closedPositions: count });
  });

  app.get('/api/finance/gas', async (_req, res) => {
    const gas = await ApiClient.getGasWallet();
    res.json(gas);
  });

  app.post('/api/finance/gas/deposit', async (req, res) => {
    const gas = await ApiClient.depositGas(Number(req.body.amount || 50));
    res.json(gas);
  });

  app.get('/api/finance/hwm', async (_req, res) => {
    const hwm = await ApiClient.getHighWaterMark();
    res.json(hwm);
  });

  app.get('/api/finance/ledgers', async (_req, res) => {
    const ledgers = await ApiClient.getFinancialLedger();
    res.json(ledgers);
  });

  app.get('/api/finance/reconcile', async (_req, res) => {
    const report = await ApiClient.runMoneyReconciliation();
    res.json(report);
  });

  app.get('/api/referrals', async (_req, res) => {
    const profile = await ApiClient.getReferralProfile();
    const members = await ApiClient.getReferralMembers();
    const distributions = await ApiClient.getReferralDistributions();
    res.json({ profile, members, distributions });
  });

  app.get('/api/subscription', async (_req, res) => {
    const status = await ApiClient.getSubscriptionStatus();
    const distributions = await ApiClient.getSubscriptionDistributions();
    res.json({ status, distributions });
  });

  app.post('/api/payments/webhook', async (_req, res) => {
    const result = await ApiClient.simulateWebhookPayment();
    res.json(result);
  });

  app.post('/api/backtest', async (req, res) => {
    const result = await ApiClient.runBacktest(req.body);
    res.json(result);
  });

  app.post('/api/chaos/run', async (req, res) => {
    const result = await ApiClient.runChaosScenario(req.body.scenarioId);
    res.json(result);
  });

  app.get('/api/audit-logs', async (req, res) => {
    const logs = await ApiClient.getAuditLogs(req.query.category as string);
    res.json(logs);
  });

  // Vite Integration in Development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ZevraBot] Production Engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
