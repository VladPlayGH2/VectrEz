// ===========================
// Vectras Catalog
// Part 3A
// ===========================

let allVMs = [];
let filteredVMs = [];

const vmList = document.getElementById("vmList");
const searchBox = document.getElementById("search");

// ---------------------------
// Load every VM
// ---------------------------

async function loadVMs() {

    try {

        const files = await fetch("vms/index.json")
            .then(r => r.json());

        const promises = files.map(file =>
            fetch(`vms/${file}.json`).then(r => r.json())
        );

        allVMs = await Promise.all(promises);

        allVMs.sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        filteredVMs = [...allVMs];

        renderVMs(filteredVMs);

    } catch (err) {

        console.error(err);

        vmList.innerHTML = `
        <div class="error">
            Failed to load VM catalog.
        </div>
        `;

    }

}

// ---------------------------
// Render cards
// ---------------------------

function renderVMs(vms) {

    vmList.innerHTML = "";

    vms.forEach(vm => {

        const card = document.createElement("div");
        card.className = "vm";

        card.innerHTML = `

<div class="vmIcon">
    <img src="${vm.icon}" alt="">
</div>

<div class="vmInfo">

    <div class="vmName">
        ${vm.name}
    </div>

    <div class="vmDetails">
        ${vm.author || "Unknown"} • v${vm.version || "?"}
    </div>

</div>

<div class="vmButtons">

<button
class="infoButton"
onclick="event.stopPropagation();showInfo('${vm.name}')">

ⓘ

</button>

<button
class="downloadButton"
onclick="event.stopPropagation();downloadVM('${vm.download}')">

⬇

</button>

</div>

`;

        vmList.appendChild(card);

    });

}

// ---------------------------
// Search
// ---------------------------

function filterVMs() {

    const text = searchBox.value
        .trim()
        .toLowerCase();

    filteredVMs = allVMs.filter(vm => {

        return (

            vm.name.toLowerCase().includes(text) ||

            (vm.author || "")
                .toLowerCase()
                .includes(text) ||

            (vm.description || "")
                .toLowerCase()
                .includes(text)

        );

    });

    renderVMs(filteredVMs);

}

// ---------------------------

function downloadVM(url) {

    window.open(url, "_blank");

}

// ---------------------------

loadVMs();

// ===========================
// Part 3B
// Info dialog + QEMU parser
// ===========================

let currentVM = null;

function showInfo(vmName) {

    currentVM = allVMs.find(vm => vm.name === vmName);

    if (!currentVM) return;

    const info = currentVM.info || {};

    document.getElementById("vmTitle").textContent =
        currentVM.name;

    document.getElementById("vmSubtitle").textContent =
        (currentVM.author || "") +
        " • v" +
        (currentVM.version || "?");

    document.getElementById("infoName").textContent =
        currentVM.name;

    document.getElementById("infoAuthor").textContent =
        currentVM.author || "Unknown";

    document.getElementById("infoVersion").textContent =
        currentVM.version || "-";

    document.getElementById("infoArch").textContent =
        info.arch || "-";

    document.getElementById("infoDiskSize").textContent =
        info.diskSize || "-";

    document.getElementById("infoFileSize").textContent =
        formatFileSize(info.fileSize);

    document.getElementById("infoDescription").textContent =
        currentVM.description || "";

    const source = document.getElementById("infoSource");

    if (currentVM.descSource) {

        source.href = currentVM.descSource;
        source.style.display = "inline";

    } else {

        source.style.display = "none";

    }

    document.getElementById("qemuCommand").textContent =
        info.qemu || "";

    document.getElementById("qemuDecoded").innerHTML = "";

    decodeQemu(info.qemu || "");
    decodeAdvancedQemu(info.qemu || "");

    openTab("information");

    document.getElementById("infoModal").style.display = "flex";

}

function closeInfo(){

    document.getElementById("infoModal").style.display="none";

}

function openTab(tab){

    document
        .querySelectorAll(".tab")
        .forEach(t=>t.classList.remove("active"));

    document
        .querySelectorAll(".tabContent")
        .forEach(t=>t.classList.remove("active"));

    if(tab==="information"){

        document
            .querySelectorAll(".tab")[0]
            .classList.add("active");

    }else{

        document
            .querySelectorAll(".tab")[1]
            .classList.add("active");

    }

    document
        .getElementById(tab)
        .classList.add("active");

}

function formatFileSize(bytes){

    bytes = Number(bytes);

    if(!bytes || isNaN(bytes))
        return "-";

    const units = [
        "B",
        "KB",
        "MB",
        "GB",
        "TB"
    ];

    let i = 0;

    while(bytes >= 1024 && i < units.length-1){

        bytes /= 1024;
        i++;

    }

    return bytes.toFixed(2) + " " + units[i];

}

function decodeQemu(cmd){

    const out = document.getElementById("qemuDecoded");

    out.innerHTML = "";

    if(!cmd) return;

    function add(name,value){

        if(!value) return;

        out.innerHTML += `
        <div class="qemuItem">
            <div class="qemuTitle">
                ${name}
            </div>
            <div class="qemuValue">
                ${value}
            </div>
        </div>
        `;

    }

    let m;

    m = cmd.match(/-cpu\s+([^\s]+)/);

    if(m){

        const cpus = {

            core2duo:"Intel Core 2 Duo",
            qemu64:"QEMU 64-bit",
            qemu32:"QEMU 32-bit",
            pentium:"Intel Pentium",
            pentium2:"Intel Pentium II",
            pentium3:"Intel Pentium III",
            pentiumpro:"Intel Pentium Pro",
            athlon:"AMD Athlon"

        };

        add(
            "CPU",
            cpus[m[1]] || m[1]
        );

    }

    m = cmd.match(/cores=(\d+)/);

    if(m)
        add("Cores",m[1]);

    m = cmd.match(/threads=(\d+)/);

    if(m)
        add("Threads",m[1]);

    m = cmd.match(/sockets=(\d+)/);

    if(m)
        add("Sockets",m[1]);

    m = cmd.match(/-m\s+([^\s]+)/);

    if(m)
        add("Memory",m[1]);

    m = cmd.match(/-vga\s+([^\s]+)/);

    if(m)
        add("Video",m[1]);

    if(cmd.includes("rtl8139"))
        add("Network","Realtek RTL8139");

    if(cmd.includes("e1000"))
        add("Network","Intel E1000");

    if(cmd.includes("virtio-net"))
        add("Network","VirtIO");

    if(cmd.includes("ac97"))
        add("Audio","AC97");

    if(cmd.includes("ich9-intel-hda"))
        add("Audio","Intel HD Audio");

    if(cmd.includes("-accel tcg"))
        add("Acceleration","TCG");

    if(cmd.includes("-accel kvm"))
        add("Acceleration","KVM");

}

// ===========================
// Part 3C
// Advanced QEMU Decoder
// ===========================

function decodeAdvancedQemu(cmd){

    if(!cmd) return;

    function add(name,value){

        if(!value) return;

        document.getElementById("qemuDecoded").innerHTML += `
        <div class="qemuItem">
            <div class="qemuTitle">${name}</div>
            <div class="qemuValue">${value}</div>
        </div>
        `;

    }

    let m;

    // Machine
    m=cmd.match(/-machine\s+([^\s]+)/);
    if(m) add("Machine",m[1]);

    // BIOS / UEFI
    if(cmd.includes("OVMF"))
        add("Firmware","UEFI (OVMF)");

    if(cmd.includes("bios.bin"))
        add("Firmware","Legacy BIOS");

    // Boot
    m=cmd.match(/-boot\s+([^\s]+)/);
    if(m) add("Boot Options",m[1]);

    // SMP
    m=cmd.match(/maxcpus=(\d+)/);
    if(m) add("Maximum CPUs",m[1]);

    // USB
    if(cmd.includes("-usb"))
        add("USB","Enabled");

    if(cmd.includes("qemu-xhci"))
        add("USB Controller","xHCI USB 3.0");

    if(cmd.includes("nec-usb-xhci"))
        add("USB Controller","NEC USB 3.0");

    if(cmd.includes("ich9-usb"))
        add("USB Controller","ICH9 USB");

    // Storage
    if(cmd.includes("virtio-blk"))
        add("Disk Controller","VirtIO Block");

    if(cmd.includes("virtio-scsi"))
        add("Disk Controller","VirtIO SCSI");

    if(cmd.includes("ide-hd"))
        add("Disk Controller","IDE");

    if(cmd.includes("ahci"))
        add("Disk Controller","AHCI SATA");

    // Display
    if(cmd.includes("virtio-vga"))
        add("Graphics","VirtIO VGA");

    if(cmd.includes("virtio-gpu"))
        add("Graphics","VirtIO GPU");

    if(cmd.includes("std"))
        add("Graphics","Standard VGA");

    if(cmd.includes("cirrus"))
        add("Graphics","Cirrus Logic");

    if(cmd.includes("qxl"))
        add("Graphics","QXL");

    // Audio
    if(cmd.includes("sb16"))
        add("Sound","Sound Blaster 16");

    if(cmd.includes("es1370"))
        add("Sound","Ensoniq ES1370");

    if(cmd.includes("hda-duplex"))
        add("Codec","HDA Duplex");

    // Network
    if(cmd.includes("user,id="))
        add("Network Backend","User Mode Networking");

    if(cmd.includes("tap"))
        add("Network Backend","TAP");

    if(cmd.includes("bridge"))
        add("Network Backend","Bridge");

    // VirtIO Devices
    if(cmd.includes("virtio-keyboard"))
        add("Keyboard","VirtIO");

    if(cmd.includes("virtio-mouse"))
        add("Mouse","VirtIO");

    if(cmd.includes("virtio-tablet"))
        add("Tablet","VirtIO");

    if(cmd.includes("virtio-balloon"))
        add("Memory Balloon","Enabled");

    if(cmd.includes("virtio-serial"))
        add("Serial","VirtIO");

    if(cmd.includes("virtio-rng"))
        add("Random Number Generator","VirtIO RNG");

    // RTC
    m=cmd.match(/-rtc\s+([^\s]+)/);
    if(m)
        add("RTC",m[1]);

    // Monitor
    if(cmd.includes("-monitor"))
        add("QEMU Monitor","Enabled");

    // Serial
    if(cmd.includes("-serial"))
        add("Serial Port","Enabled");

    // Parallel
    if(cmd.includes("-parallel"))
        add("Parallel Port","Enabled");

    // Snapshot
    if(cmd.includes("-snapshot"))
        add("Snapshot Mode","Enabled");

}