let emulator = null;
let linuxPronto = false;
let bufferSaida = "";

const screen = document.getElementById("screen_container");
const terminal = new Terminal({
  cursorBlink: true,
  scrollback: 5000,
  fontSize: 14,
  fontFamily: 'Consolas, "Courier New", monospace',
  theme: { background: "#000000", foreground: "#d2e9d0", cursor: "#ffffff" }
});

terminal.open(screen);
terminal.writeln("Inicializando ambiente Linux...");

function setStatus(texto, online = false) {
  document.getElementById("statusText").textContent = texto;
  document.getElementById("statusDot").classList.toggle("online", online);
}

function iniciarLinux() {
  setStatus("Carregando Linux...", false);

  try {
    emulator = new V86({
      wasm_path: "v86/v86.wasm",
      memory_size: 128 * 1024 * 1024,
      vga_memory_size: 8 * 1024 * 1024,
      bios: { url: "bios/seabios.bin" },
      vga_bios: { url: "bios/vgabios.bin" },
      bzimage: { url: "linux/buildroot-bzimage68.bin", async: false },
      filesystem: {},
      cmdline: "tsc=reliable mitigations=off random.trust_cpu=on",
      autostart: true
    });

    emulator.add_listener("serial0-output-byte", byte => {
      const char = String.fromCharCode(byte);
      terminal.write(char);
      bufferSaida = (bufferSaida + char).slice(-20);

      if (!linuxPronto && bufferSaida.endsWith("~% ")) {
        linuxPronto = true;
        setStatus("Linux pronto", true);
        terminal.focus();
      }
    });

    terminal.onData(dados => {
      if (emulator?.serial0_send) emulator.serial0_send(dados);
    });
  } catch (erro) {
    console.error("Erro ao iniciar Linux:", erro);
    terminal.writeln("\r\nErro ao carregar o Linux.");
    terminal.writeln("Verifique os arquivos v86, bios e linux.");
    setStatus("Erro ao iniciar Linux", false);
  }
}

document.getElementById("restartButton").addEventListener("click", () => location.reload());
document.getElementById("clearButton").addEventListener("click", () => {
  terminal.clear();
  if (emulator?.serial0_send) emulator.serial0_send("clear\n");
  terminal.focus();
});
screen.addEventListener("click", () => terminal.focus());
window.addEventListener("load", iniciarLinux);
