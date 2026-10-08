const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_FILE = path.join(__dirname, 'data', 'db.json');

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ensureDataFile() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const defaultData = {
      factories: [
        { id: 'FAC-001', name: 'مصنع الرياض', city: 'الرياض', status: 'نشط', manager: 'أحمد العتيبي' },
        { id: 'FAC-002', name: 'مصنع جدة', city: 'جدة', status: 'نشط', manager: 'سارة محمد' },
        { id: 'FAC-003', name: 'مصنع الدمام', city: 'الدمام', status: 'معلق', manager: 'خالد حسن' }
      ],
      warehouses: [
        { id: 'WH-101', name: 'مستودع شمال', city: 'الرياض', capacity: '1200', usage: '78%' },
        { id: 'WH-102', name: 'مستودع جنوب', city: 'جدة', capacity: '900', usage: '64%' },
        { id: 'WH-103', name: 'مستودع الخليج', city: 'الدمام', capacity: '1500', usage: '83%' }
      ],
      shipments: [
        { id: 'TR-1001', route: 'الرياض → جدة', status: 'قيد التتبع', vehicle: 'شاحنة 12 طن', eta: '2026-10-08 16:00', progress: 72 },
        { id: 'TR-1002', route: 'جدة → الدمام', status: 'قيد التحضير', vehicle: 'شاحنة 8 طن', eta: '2026-10-09 10:30', progress: 35 },
        { id: 'TR-1003', route: 'الدمام → الرياض', status: 'مكتمل', vehicle: 'نقل مبرد', eta: '2026-10-07 18:45', progress: 100 }
      ],
      orders: [
        { id: 'PO-2101', supplier: 'شركة الخليج للمواد', item: 'أسلاك فولاذية', qty: 480, status: 'قيد التنفيذ', destination: 'مصنع الرياض' },
        { id: 'PO-2102', supplier: 'مؤسسة القيم', item: 'أجزاء ميكانيكية', qty: 230, status: 'معلق', destination: 'مصنع جدة' },
        { id: 'PO-2103', supplier: 'شركة النور', item: 'مواد التعبئة', qty: 600, status: 'مكتمل', destination: 'مصنع الدمام' }
      ],
      inventory: [
        { sku: 'MAT-110', name: 'فولاذ', warehouse: 'مستودع شمال', quantity: 920, level: 'متوسط' },
        { sku: 'MAT-220', name: 'مكونات إلكترونية', warehouse: 'مستودع جنوب', quantity: 245, level: 'منخفض' },
        { sku: 'MAT-330', name: 'مواد تعبئة', warehouse: 'مستودع الخليج', quantity: 1100, level: 'ممتاز' }
      ],
      alerts: [
        { id: 'AL-01', title: 'تدني مستوى مخزون المكونات الإلكترونية', severity: 'عالية', detail: 'الكمية الحالية أقل من الحد الأدنى بنسبة 22%.' },
        { id: 'AL-02', title: 'تأخير في شاحنة جدة', severity: 'متوسطة', detail: 'تمت إعادة جدولة الوصول إلى الساعة 18:15.' },
        { id: 'AL-03', title: 'مرور شحنات عبر قسم التوزيع', severity: 'منخفضة', detail: 'التنفيذ مطابق للجدول المطلوب.' }
      ]
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

function readDb() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    return {
      factories: [],
      warehouses: [],
      shipments: [],
      orders: [],
      inventory: [],
      alerts: []
    };
  }
}

function saveDb(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.svg': return 'image/svg+xml';
    case '.png': return 'image/png';
    case '.jpg': case '.jpeg': return 'image/jpeg';
    default: return 'application/octet-stream';
  }
}

function serveStatic(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = filePath.split('?')[0];

  const resolvedPath = path.join(PUBLIC_DIR, filePath);

  if (!resolvedPath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  fs.readFile(resolvedPath, (err, data) => {
    if (err) {
      if (req.url === '/index.html' || req.url === '/') {
        sendJson(res, 404, { error: 'Page not found' });
        return;
      }
      sendJson(res, 404, { error: 'File not found' });
      return;
    }

    res.writeHead(200, { 'Content-Type': getContentType(resolvedPath) });
    res.end(data);
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) {
        req.socket.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function buildDashboard(data) {
  const totalFactories = data.factories.length;
  const activeShipments = data.shipments.filter(item => item.status !== 'مكتمل').length;
  const pendingOrders = data.orders.filter(item => item.status !== 'مكتمل').length;
  const inventoryAlerts = data.inventory.filter(item => item.level === 'منخفض').length;

  return {
    summary: {
      totalFactories,
      activeShipments,
      pendingOrders,
      inventoryAlerts,
      onTimeRate: '94%'
    },
    latestActivity: data.shipments.slice(0, 3),
    inventoryAlertItems: data.inventory.filter(item => item.level !== 'ممتاز').slice(0, 3)
  };
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = reqUrl.pathname;

  if (pathname === '/api/health') {
    sendJson(res, 200, { status: 'ok', service: 'factory-logistics-management-system' });
    return;
  }

  if (pathname === '/api/dashboard') {
    const data = readDb();
    sendJson(res, 200, buildDashboard(data));
    return;
  }

  if (pathname === '/api/factories') {
    const data = readDb();
    if (req.method === 'GET') {
      sendJson(res, 200, data.factories);
      return;
    }
    if (req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const newFactory = {
          id: body.id || `FAC-${String(data.factories.length + 1).padStart(3, '0')}`,
          name: body.name || 'مصنع جديد',
          city: body.city || 'مدينة غير محددة',
          status: body.status || 'نشط',
          manager: body.manager || 'غير محدد'
        };
        data.factories.push(newFactory);
        saveDb(data);
        sendJson(res, 201, newFactory);
      } catch (error) {
        sendJson(res, 400, { error: error.message || 'Unable to create factory' });
      }
      return;
    }
  }

  if (pathname === '/api/warehouses') {
    const data = readDb();
    if (req.method === 'GET') {
      sendJson(res, 200, data.warehouses);
      return;
    }
    if (req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const item = {
          id: body.id || `WH-${Date.now()}`,
          name: body.name || 'مستودع جديد',
          city: body.city || 'غير محدد',
          capacity: body.capacity || '0',
          usage: body.usage || '0%'
        };
        data.warehouses.push(item);
        saveDb(data);
        sendJson(res, 201, item);
      } catch (error) {
        sendJson(res, 400, { error: error.message || 'Unable to create warehouse' });
      }
      return;
    }
  }

  if (pathname === '/api/shipments') {
    const data = readDb();
    if (req.method === 'GET') {
      sendJson(res, 200, data.shipments);
      return;
    }
    if (req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const item = {
          id: body.id || `TR-${Date.now()}`,
          route: body.route || 'مسار جديد',
          status: body.status || 'قيد التحضير',
          vehicle: body.vehicle || 'شاحنة غير محددة',
          eta: body.eta || new Date().toISOString().slice(0, 16).replace('T', ' '),
          progress: toNumber(body.progress, 0)
        };
        data.shipments.unshift(item);
        saveDb(data);
        sendJson(res, 201, item);
      } catch (error) {
        sendJson(res, 400, { error: error.message || 'Unable to create shipment' });
      }
      return;
    }

    if (req.method === 'PATCH') {
      try {
        const body = await parseBody(req);
        const id = reqUrl.searchParams.get('id');
        if (!id) {
          sendJson(res, 400, { error: 'Missing shipment id' });
          return;
        }
        const shipment = data.shipments.find(item => item.id === id);
        if (!shipment) {
          sendJson(res, 404, { error: 'Shipment not found' });
          return;
        }
        shipment.status = body.status || shipment.status;
        shipment.progress = toNumber(body.progress, shipment.progress);
        saveDb(data);
        sendJson(res, 200, shipment);
      } catch (error) {
        sendJson(res, 400, { error: error.message || 'Unable to update shipment' });
      }
      return;
    }
  }

  if (pathname === '/api/orders') {
    const data = readDb();
    if (req.method === 'GET') {
      sendJson(res, 200, data.orders);
      return;
    }
    if (req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const item = {
          id: body.id || `PO-${Date.now()}`,
          supplier: body.supplier || 'مورد جديد',
          item: body.item || 'مادة جديدة',
          qty: toNumber(body.qty, 0),
          status: body.status || 'قيد التنفيذ',
          destination: body.destination || 'غير محدد'
        };
        data.orders.unshift(item);
        saveDb(data);
        sendJson(res, 201, item);
      } catch (error) {
        sendJson(res, 400, { error: error.message || 'Unable to create order' });
      }
      return;
    }
  }

  if (pathname === '/api/inventory') {
    const data = readDb();
    if (req.method === 'GET') {
      sendJson(res, 200, data.inventory);
      return;
    }
    if (req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const item = {
          sku: body.sku || `MAT-${Date.now()}`,
          name: body.name || 'مادة جديدة',
          warehouse: body.warehouse || 'غير محدد',
          quantity: toNumber(body.quantity, 0),
          level: body.level || 'متوسط'
        };
        data.inventory.push(item);
        saveDb(data);
        sendJson(res, 201, item);
      } catch (error) {
        sendJson(res, 400, { error: error.message || 'Unable to create inventory item' });
      }
      return;
    }
  }

  if (pathname === '/api/alerts') {
    const data = readDb();
    if (req.method === 'GET') {
      sendJson(res, 200, data.alerts);
      return;
    }
    if (req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const item = {
          id: body.id || `AL-${Date.now()}`,
          title: body.title || 'تنبيه جديد',
          severity: body.severity || 'متوسطة',
          detail: body.detail || 'نص التنبيه غير محدد'
        };
        data.alerts.unshift(item);
        saveDb(data);
        sendJson(res, 201, item);
      } catch (error) {
        sendJson(res, 400, { error: error.message || 'Unable to create alert' });
      }
      return;
    }
  }

  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
});

server.listen(PORT, () => {
  console.log(`Factory Logistics System running at http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down server');
  process.exit(0);
});
