// Dev-only SMTP sink used to verify email delivery (invitations, password
// resets) without a real mailbox. Captured messages are written as JSON files
// to ./tmp-emails (or MAIL_DIR). Run with: node scripts/capture-smtp.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SMTPServer } from "smtp-server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mailDir = process.env.MAIL_DIR ?? path.resolve(__dirname, "../tmp-emails");
fs.mkdirSync(mailDir, { recursive: true });

const server = new SMTPServer({
  disabledCommands: ["AUTH"],
  hideSTARTTLS: true,
  onData(stream, session, callback) {
    let body = "";
    stream.on("data", (chunk) => (body += chunk.toString()));
    stream.on("end", () => {
      const file = path.join(mailDir, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`);
      fs.writeFileSync(
        file,
        JSON.stringify(
          {
            from: session.envelope.mailFrom?.address ?? null,
            to: (session.envelope.rcptTo ?? []).map((r) => r.address),
            body,
          },
          null,
          2,
        ),
      );
      console.log(`[capture] ${file} -> ${session.envelope.rcptTo.map((r) => r.address).join(", ")}`);
      callback();
    });
  },
});

server.listen(2525, "127.0.0.1", () => {
  console.log(`SMTP capture listening on 127.0.0.1:2525 (writing to ${mailDir})`);
});
