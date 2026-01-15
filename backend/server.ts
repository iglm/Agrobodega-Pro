
import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Permitir ráfagas de datos grandes

/**
 * Endpoint Maestro de Sincronización
 * Recibe una colección de registros y los guarda/actualiza.
 */
app.post('/api/v1/:entity/sync', async (req: Request, res: Response) => {
  const { entity } = req.params;
  const records = req.body;

  if (!Array.isArray(records)) {
    return res.status(400).json({ error: 'Body must be an array of records' });
  }

  const table = (prisma as any)[entity];
  if (!table) {
    return res.status(404).json({ error: `Entity ${entity} not found` });
  }

  try {
    const results = await prisma.$transaction(
      records.map((record: any) => {
        // Limpiar campos que no pertenecen a la DB o son generados por el servidor
        const { serverId, syncStatus, ...data } = record;
        
        // Conversión de fechas y números si es necesario
        if (data.date) data.date = new Date(data.date);
        if (data.lastUpdated) data.lastUpdated = BigInt(data.lastUpdated);

        return table.upsert({
          where: { id: record.id },
          update: data,
          create: data,
        });
      })
    );

    // Devolvemos los IDs locales y los ServerIDs generados para confirmar la sync
    const confirmation = results.map((r: any) => ({
      id: r.id,
      serverId: r.serverId,
      lastUpdated: Number(r.lastUpdated)
    }));

    console.log(`[Sync] Successfully synced ${results.length} records for ${entity}`);
    res.json({ success: true, synced: confirmation });

  } catch (error: any) {
    console.error(`[Sync Error] ${entity}:`, error);
    res.status(500).json({ 
      error: 'Failed to sync records', 
      details: error.message 
    });
  }
});

// Health check para Cloud Run
app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`🚀 AgroBodega Cloud Engine running on port ${PORT}`);
});
