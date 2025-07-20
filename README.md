# 🔧 reconf

**reconf** is a **text user interface (TUI)** configuration editor for [rEFInd](https://www.rodsbooks.com/refind/), built with Node.js and [blessed](https://github.com/chjj/blessed). it offers a keyboard-based, minimal interface for navigating and editing rEFInd configuration files — no need to touch nano or vim ever again 😭

---

## ✨ features

- clean, keyboard-controlled TUI
- reads and edits `refind.conf` and other related config formats
- schema-aware save validation
- fast startup, no bloat
- fully local — runs in any terminal

---

## 📦 installation

```bash
git clone https://github.com/reconf-refind/reconf
cd reconf
npm install
```

⚠️ reconf doesn't work on linux, since it needs to read AND write to the ESP.

ⓘ  don't panic for the 'write to the ESP', rEFInd's config is in the ESP.

## usage

```bash
sudo reconf [-Vd]
```

   you will need to `sudo reconf` to correctly use `reconf`.

   do NOT `fakeroot reconf`, since reconf needs REAL root access to rw to the ESP.

*esp stands for (u)Efi System Partition   where an uppercase letter is one of the letters of the abbreviation*

---

🧑‍💻 maintained by [`isoextdev`](https://github.com/isoextdev)

🏢 under [`reconf-refind`](https://github.com/reconf-refind) org
