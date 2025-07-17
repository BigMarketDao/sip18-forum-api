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
  CONFIG.host = process.env[network + "_forum_host"] || "";
  CONFIG.port = Number(process.env[network + "_forum_port"]) || 3025;
  CONFIG.mongoDbUrl = process.env[network + "_forum_mongoDbUrl"] || "";
  CONFIG.mongoDbName = process.env[network + "_forum_mongoDbName"] || "sip18-devnet";
  CONFIG.mongoUser = process.env[network + "_forum_mongoUser"] || "";
  CONFIG.mongoPwd = process.env[network + "_forum_mongoPwd"] || "";
  CONFIG.network = process.env[network + "_forum_network"] || "";
  CONFIG.stacksApi = process.env[network + "_forum_stacksApi"] || "";
  CONFIG.publicAppBaseUrl = network === "devnet" ? "http://localhost:8081" : "http://localhost:3000";
  CONFIG.publicAppName = process.env[network + "_forum_publicAppName"] || "";
  CONFIG.publicAppVersion = process.env[network + "_forum_publicAppVersion"] || "";
}

export function getConfig() {
  return CONFIG;
}

export function isDev() {
  const environ = process.env.NODE_ENV;
  return !environ || environ === "test" || environ === "development" || environ === "dev";
}
