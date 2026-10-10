// Usage: bun run setup [--uninstall]
// Adds `go` to /etc/hosts and runs the server at boot on port 80 as a macOS LaunchDaemon.
// Re-run it to restart the service. Asks for your password via sudo.
import { $ } from "bun";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const LABEL = "com.go-links";
const PLIST = `/Library/LaunchDaemons/${LABEL}.plist`;
const HOSTS_LINE = "127.0.0.1 go";
const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

await $`sudo -v`;
await $`sudo launchctl bootout system/${LABEL}`.nothrow().quiet();

if (process.argv.includes("--uninstall")) {
  await $`sudo rm -f ${PLIST}`;
  await $`sudo sed -i '' '/^127.0.0.1 go$/d' /etc/hosts`;
  console.log("Uninstalled.");
  process.exit(0);
}

if (!(await Bun.file("/etc/hosts").text()).split("\n").includes(HOSTS_LINE)) {
  await $`echo ${HOSTS_LINE} | sudo tee -a /etc/hosts`.quiet();
}

const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key><array><string>${xml(process.execPath)}</string><string>index.ts</string></array>
  <key>WorkingDirectory</key><string>${xml(resolve(import.meta.dir, ".."))}</string>
  <key>EnvironmentVariables</key><dict><key>NODE_ENV</key><string>production</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/go-links.log</string>
  <key>StandardErrorPath</key><string>/tmp/go-links.log</string>
</dict>
</plist>
`;
const tmp = `${tmpdir()}/${LABEL}.plist`;
await Bun.write(tmp, plist);
await $`sudo install -m 644 -o root -g wheel ${tmp} ${PLIST}`;
await $`sudo launchctl bootstrap system ${PLIST}`;

await Bun.sleep(1000);
const ok = (await fetch("http://go/").catch(() => null))?.ok;
console.log(ok ? "Running: http://go/" : "Installed, but http://go/ didn't respond. Check /tmp/go-links.log");
