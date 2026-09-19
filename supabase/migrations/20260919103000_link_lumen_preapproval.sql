/*
  # Link LUMEN subscription to its Mercado Pago preapproval

  Preapproval 3270d469aad54478ab5306560617aeca (authorized, R$ 97, 17/09/2026)
  was created outside the checkout flow, so it carries no external_reference and
  nothing ever wrote it back to the subscription row. The customer was paying
  while the panel showed the subscription as pending — the sync drift report
  flagged it as the only live preapproval with no local record.

  Identity confirmed by the admin on 18/09/2026: LUMEN SOLUCOES ENGENHARIA LTDA
  (Sergio Arruda). Targets the most recent pending LUMEN row; both pending rows
  are retries of the same checkout and neither holds a live preapproval, since
  the sync run right before this updated nothing.
*/

UPDATE subscriptions s
SET mp_subscription_id = '3270d469aad54478ab5306560617aeca',
    status     = 'active',
    started_at = '2026-09-17T14:04:11Z',
    expires_at = '2026-10-17T14:04:11Z',
    updated_at = now()
WHERE s.id = (
  SELECT s2.id
  FROM subscriptions s2
  JOIN customers c ON c.id = s2.customer_id
  WHERE c.name ILIKE '%lumen%' AND s2.status = 'pending'
  ORDER BY s2.created_at DESC
  LIMIT 1
);
