export function getEnv(name, fallback = undefined) {
  return process.env[name] ?? fallback;
}

export function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getAppBaseUrl() {
  return getEnv("APP_BASE_URL", "http://localhost:3000");
}

export function getAwsRegion() {
  return getEnv("AWS_REGION", "us-east-1");
}
