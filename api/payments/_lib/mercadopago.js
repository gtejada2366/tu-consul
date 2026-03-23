import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

let _client = null;

export function getMPClient() {
  if (_client) return _client;
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Missing MP_ACCESS_TOKEN env variable");
  _client = new MercadoPagoConfig({ accessToken });
  return _client;
}

export function getPreferenceAPI() {
  return new Preference(getMPClient());
}

export function getPaymentAPI() {
  return new Payment(getMPClient());
}

/** Plan prices in PEN */
export const PLAN_PRICES = {
  basic: 99,
  premium: 199,
};
