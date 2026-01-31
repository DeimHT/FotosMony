/**
 * Webpay Plus (Transbank) REST API.
 * Crear transacción: POST /rswebpaytransaction/api/webpay/v1.2/transactions
 * Confirmar transacción: PUT /rswebpaytransaction/api/webpay/v1.2/transactions/{token}
 */

const WEBPAY_VERSION = "v1.2";

export type WebpayCreatePayload = {
  buy_order: string;
  session_id: string;
  amount: number;
  return_url: string;
};

export type WebpayCreateResponse = {
  token: string;
  url: string;
};

export type WebpayCommitResponse = {
  vci: string;
  amount: number;
  status: string;
  buy_order: string;
  session_id: string;
  card_detail?: { card_number: string };
  accounting_date?: string;
  transaction_date?: string;
  authorization_code?: string;
  payment_type_code?: string;
  response_code: number;
  installments_number?: number;
};

function getWebpayConfig() {
  const baseUrl = process.env.WEBPAY_BASE_URL ?? "https://webpay3gint.transbank.cl";
  const apiKeyId = process.env.WEBPAY_API_KEY_ID;
  const apiKeySecret = process.env.WEBPAY_API_KEY_SECRET;
  if (!apiKeyId || !apiKeySecret) {
    throw new Error("WEBPAY_API_KEY_ID y WEBPAY_API_KEY_SECRET son obligatorios");
  }
  return { baseUrl, apiKeyId, apiKeySecret };
}

export async function webpayCreateTransaction(
  payload: WebpayCreatePayload
): Promise<WebpayCreateResponse> {
  const { baseUrl, apiKeyId, apiKeySecret } = getWebpayConfig();
  const url = `${baseUrl}/rswebpaytransaction/api/webpay/${WEBPAY_VERSION}/transactions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Tbk-Api-Key-Id": apiKeyId,
      "Tbk-Api-Key-Secret": apiKeySecret,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error_message?: string }).error_message ?? `Webpay: ${res.status} ${res.statusText}`
    );
  }

  return res.json() as Promise<WebpayCreateResponse>;
}

export async function webpayCommitTransaction(
  token: string
): Promise<WebpayCommitResponse> {
  const { baseUrl, apiKeyId, apiKeySecret } = getWebpayConfig();
  const url = `${baseUrl}/rswebpaytransaction/api/webpay/${WEBPAY_VERSION}/transactions/${token}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Tbk-Api-Key-Id": apiKeyId,
      "Tbk-Api-Key-Secret": apiKeySecret,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error_message?: string }).error_message ?? `Webpay commit: ${res.status} ${res.statusText}`
    );
  }

  return res.json() as Promise<WebpayCommitResponse>;
}
