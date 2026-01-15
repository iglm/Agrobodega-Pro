
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Middleware de Logs básico
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

/**
 * Endpoint de Sincronización Bidireccional
 * Recibe cambios locales y devuelve actualizaciones remotas
 */
app.post('/api/v1/sync', async (req, res) => {
  const { warehouseId, lastSyncDate, collections } = req.body;

  if (!warehouseId) return res.status(400).json({ error: 'warehouseId is required' });

  try {
    const results: any = {
      acceptedIds: {},
      serverUpdates: {}
    };

    // 1. Procesar ráfaga entrante (Push de Cliente)
    // Implementamos LWW: Solo guardamos si lastModified del cliente es superior
    for (const [colName, items] of Object.entries(collections)) {
      const typedItems = items as any[];
      const acceptedForThisCol: string[] = [];

      for (const item of typedItems) {
        const table = (prisma as any)[colName];
        if (!table) continue;

        const existing = await table.findUnique({ where: { id: item.id } });

        // Si no existe o si el cambio del cliente es más reciente
        if (!existing || new Date(item.lastModified) > new Date(existing.lastModified)) {
          await table.upsert({
            where: { id: item.id },
            update: { ...item, lastModified: new Date(item.lastModified) },
            create: { ...item, lastModified: new Date(item.lastModified) }
          });
          acceptedForThisCol.push(item.id);
        }
      }
      results.acceptedIds[colName] = acceptedForThisCol;
    }

    // 2. Obtener cambios del servidor desde la última sincronización (Pull del Cliente)
    if (lastSyncDate) {
      const since = new Date(lastSyncDate);
      const tablesToFetch = ['inventoryItem', 'laborLog', 'costCenter', 'financeLog'];
      
      for (const tableName of tablesToFetch) {
        const updates = await (prisma as any)[tableName].findMany({
          where: {
            warehouseId,
            lastModified: { gt: since }
          }
        });
        results.serverUpdates[tableName] = updates;
      }
    }

    res.json(results);
  } catch (error) {
    console.error('CRITICAL SYNC ERROR:', error);
    res.status(500).json({ error: 'Internal sync failure' });
  }
});

/**
 * Rutas de consulta rápida
 */
app.get('/api/v1/inventory/:warehouseId', async (req, res) => {
  const data = await prisma.inventoryItem.findMany({ where: { warehouseId: req.params.warehouseId } });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`🚀 AgroBodega Backend listo en puerto ${PORT}`);
});
