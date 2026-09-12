import { randomBytes } from "node:crypto";

const production = process.argv.includes("--production");
const destination = production ? ".env.production.local" : ".env.local";
if (await Bun.file(destination).exists()) {
  console.log(`${destination} already exists; keeping your configuration.`);
} else {
  const template = await Bun.file(production ? ".env.production.example" : ".env.blog.example").text();
  await Bun.write(destination, template
    .replace("ADMIN_PASSWORD=", `ADMIN_PASSWORD=${randomBytes(24).toString("hex")}`)
    .replace("JWT_SECRET=", `JWT_SECRET=${randomBytes(32).toString("hex")}`));
  console.log(`Created ${destination} with unique ${production ? "production" : "development"} credentials. Read ADMIN_PASSWORD there; do not share or commit it.`);
}
