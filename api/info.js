export default function handler(request, response) {
  response.status(200).json({
    name: "pharmahub",
    version: "1.0.0",
    mode: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    timestamp: new Date().toISOString(),
  });
}
