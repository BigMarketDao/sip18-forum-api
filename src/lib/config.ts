import process from "process";

export type ConfigI = {
  mongoDbUrl: string;
  mongoUser: string;
  mongoPwd: string;
  mongoDbName: string;
  host: string;
  port: number;
  network: string;
  publicAppBaseUrl: string;
  publicAppName: string;
  publicAppVersion: string;
  stacksApi: string;
};

let CONFIG = {} as ConfigI;
export let BASE_URL: string;

export function printConfig() {
  console.log("== " + process.env.NODE_ENV + " ==========================================================");
  console.log("mongoDbName = " + CONFIG.mongoDbName);
  console.log("mongoUser = " + CONFIG.mongoUser);
  console.log("host = " + CONFIG.host + ":" + CONFIG.port);
  console.log("stacksApi = " + CONFIG.stacksApi);
  console.log("network = " + CONFIG.network);
  console.log("publicAppName = " + CONFIG.publicAppName);
  console.log("publicAppVersion = " + CONFIG.publicAppVersion);
}

export function setConfigOnStart() {
  const network = process.env.NODE_ENV;

  CONFIG.host = process.env[network + "_sui_host"] || "";
  CONFIG.port = Number(3025);
  CONFIG.host = process.env[network + "_sui_host"] || "";

  CONFIG.mongoDbUrl = process.env[network + "_sui_mongoDbUrl"] || "";
  CONFIG.mongoDbName = "sip18-devnet";
  CONFIG.mongoUser = process.env[network + "_sui_mongoUser"] || "";
  CONFIG.mongoPwd = process.env[network + "_sui_mongoPwd"] || "";

  CONFIG.network = process.env[network + "_sui_network"] || "";
  CONFIG.stacksApi = process.env[network + "_sui_stacksApi"] || "";
  CONFIG.publicAppBaseUrl = network === "devnet" ? "http://localhost:8081" : "http://localhost:3000";
  CONFIG.publicAppName = process.env[network + "_sui_publicAppName"] || "";
  CONFIG.publicAppVersion = process.env[network + "_sui_publicAppVersion"] || "";
}

export function getConfig() {
  return CONFIG;
}

export function isDev() {
  const environ = process.env.NODE_ENV;
  return !environ || environ === "test" || environ === "development" || environ === "dev";
}
