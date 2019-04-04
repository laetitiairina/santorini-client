import { isProduction } from "./isProduction";

/**
 * This helper function return the current domain of the API. If is production, the Production Heroku URL will returned.
 * Otherwise, the link localhost:8080 will be returned (Spring server default port)
 * @returns {string}
 */
export const getDomain = () => {
  const prodUrl = "https://sopra-fs19-group10-server.herokuapp.com";
  const devUrl = "http://localhost:8080";
  if (isProduction()) {
    return prodUrl;
  }
  return devUrl;
};
