import { createHash, randomUUID } from 'node:crypto';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    const body = req.body || {};

    const decision_id = randomUUID();
    const decision_hash = createHash('sha256')
      .update(JSON.stringify(body) + Date.now())
      .digest('hex');

    return res.status(200).json({
      decision_id,
      decision_hash,
      risk_level: "RIESGO_CONTROLADO",
      insight: "El movimiento puede ser absorbido sin comprometer caja en el corto plazo.",
      counterfactual: "Si la absorción fuera menor, el riesgo escalaría a crítico.",
      pressure_score: 0.42,
      pressure_day: 18,
      structural_load: "STABLE"
    });
  } catch {
    return res.status(400).json({ error: 'invalid_request' });
  }
}
